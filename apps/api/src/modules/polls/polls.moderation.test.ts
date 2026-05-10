import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { prisma } from '../../config/database';
import * as pollsService from './polls.service';
import * as aiService from '../../services/ai.service';
import { calculateBackoffMinutes, processPendingModerations } from './polls.moderation.service';

// Mock AI service module
vi.mock('../../services/ai.service', async () => {
  const actual = await vi.importActual('../../services/ai.service');
  return {
    ...actual,
    checkPollSafety: vi.fn(),
  };
});

describe('Poll Synchronous Moderation', () => {
  const testUserId = 'test-moderator-user';

  beforeEach(async () => {
    // Ensure clean db state for testing
    await prisma.pollModeration.deleteMany({});
    await prisma.poll.deleteMany({});
    await prisma.user.deleteMany({});

    // Create reference user
    await prisma.user.create({
      data: {
        id: testUserId,
        email: 'mod@example.com',
        name: 'Mod User',
      },
    });

    vi.clearAllMocks();
  });

  afterEach(async () => {
    await prisma.pollModeration.deleteMany({});
    await prisma.poll.deleteMany({});
    await prisma.user.deleteMany({});
  });

  it('should successfully create a poll and moderation record if AI approves', async () => {
    // Arrange
    vi.mocked(aiService.checkPollSafety).mockResolvedValue({
      allowed: true,
      reason: null,
    });

    const mockInput = {
      title: 'Legitimate Poll',
      description: 'Discussing technology',
      questions: [
        {
          text: 'Which framework?',
          options: [{ text: 'React' }, { text: 'Vue' }],
        },
      ],
    };

    // Act
    const result = await pollsService.createPoll(testUserId, mockInput as any);

    // Assert
    expect(result).toBeDefined();
    expect(result.title).toBe('Legitimate Poll');

    // Check database
    const savedPoll = await prisma.poll.findUnique({
      where: { id: result.id },
      include: { moderation: true },
    });

    expect(savedPoll).toBeDefined();
    expect(savedPoll?.moderation).toBeDefined();
    expect(savedPoll?.moderation?.status).toBe('APPROVED');
    expect(aiService.checkPollSafety).toHaveBeenCalledTimes(1);
  });

  it('should throw exception and not insert database records if AI rejects', async () => {
    // Arrange
    vi.mocked(aiService.checkPollSafety).mockResolvedValue({
      allowed: false,
      reason: 'Explicit content violation',
    });

    const mockInput = {
      title: 'Naughty Topic',
      description: 'This should be rejected',
      questions: [
        {
          text: 'Sample Question?',
          options: [{ text: 'A' }, { text: 'B' }],
        },
      ],
    };

    // Act & Assert
    await expect(pollsService.createPoll(testUserId, mockInput as any)).rejects.toThrow(
      'Poll content rejected by moderation: Explicit content violation'
    );

    // Verify absolutely zero poll records created in DB
    const pollCount = await prisma.poll.count();
    expect(pollCount).toBe(0);
  });

  it('should fail-open to PENDING if the AI service throws a network error', async () => {
    // Arrange
    vi.mocked(aiService.checkPollSafety).mockRejectedValue(new Error('API timeout or DNS failure'));

    const mockInput = {
      title: 'Resilient Poll',
      description: 'Content created during outages',
      questions: [
        {
          text: 'Sample Question?',
          options: [{ text: 'A' }, { text: 'B' }],
        },
      ],
    };

    // Act
    const result = await pollsService.createPoll(testUserId, mockInput as any);

    // Assert
    expect(result).toBeDefined();
    expect(result.title).toBe('Resilient Poll');

    // Verify the DB contains both poll and the PENDING moderation row
    const savedPoll = await prisma.poll.findUnique({
      where: { id: result.id },
      include: { moderation: true },
    });

    expect(savedPoll).toBeDefined();
    expect(savedPoll?.moderation).toBeDefined();
    expect(savedPoll?.moderation?.status).toBe('PENDING');
    
    // nextRetryAt should exist and be roughly 5 minutes in the future
    expect(savedPoll?.moderation?.nextRetryAt).toBeDefined();
    const nextRetry = savedPoll?.moderation?.nextRetryAt as Date;
    const fiveMinsFromNow = Date.now() + 5 * 60 * 1000;
    
    // Confirm the timestamp aligns reasonably well with roughly 5 mins deviation tolerant within 10 seconds execution jitter
    expect(Math.abs(nextRetry.getTime() - fiveMinsFromNow)).toBeLessThan(10000); 
  });
});

describe('Poll Moderation Background Worker', () => {
  const testUserId = 'test-moderator-user';

  beforeEach(async () => {
    await prisma.notification.deleteMany({});
    await prisma.pollModeration.deleteMany({});
    await prisma.poll.deleteMany({});
    await prisma.user.deleteMany({});

    await prisma.user.create({
      data: {
        id: testUserId,
        email: 'mod@example.com',
        name: 'Mod User',
      },
    });

    vi.clearAllMocks();
  });

  describe('Unit: calculateBackoffMinutes', () => {
    it('should adhere precisely to the requested intervals', () => {
      // 0 failures (default/initial config interval)
      expect(calculateBackoffMinutes(0)).toBe(5);
      // 1 failure -> 20 minutes
      expect(calculateBackoffMinutes(1)).toBe(20);
      // 2 failures -> 80 clamped to 60 minutes (1h)
      expect(calculateBackoffMinutes(2)).toBe(60);
      // Higher counts stay clamped at 60
      expect(calculateBackoffMinutes(5)).toBe(60);
    });
  });

  describe('Integration: processPendingModerations', () => {
    it('should transition a 20-day-old poll to MANUAL_REVIEW immediately', async () => {
      // Arrange: Create a pending job from 21 days ago
      const oldDate = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000);
      
      const poll = await prisma.poll.create({
        data: {
          creatorId: testUserId,
          title: 'Old Poll',
          description: 'Old description',
          moderation: {
            create: {
              status: 'PENDING',
              createdAt: oldDate,
              nextRetryAt: new Date(), // Due now
            },
          },
        },
      });

      // Act
      await processPendingModerations();

      // Assert
      const mod = await prisma.pollModeration.findUnique({ where: { pollId: poll.id } });
      expect(mod?.status).toBe('MANUAL_REVIEW');
      expect(aiService.checkPollSafety).not.toHaveBeenCalled(); // Skip AI entirely
    });

    it('should approve valid content asynchronously', async () => {
      // Arrange
      vi.mocked(aiService.checkPollSafety).mockResolvedValue({ allowed: true, reason: null });

      const poll = await prisma.poll.create({
        data: {
          creatorId: testUserId,
          title: 'Safe Async Poll',
          description: 'Safe content description',
          moderation: {
            create: {
              status: 'PENDING',
              nextRetryAt: new Date(),
            },
          },
        },
      });

      // Act
      await processPendingModerations();

      // Assert
      const mod = await prisma.pollModeration.findUnique({ where: { pollId: poll.id } });
      expect(mod?.status).toBe('APPROVED');
      expect(mod?.nextRetryAt).toBeNull();
    });

    it('should reject violations, archive the poll, and notify user', async () => {
      // Arrange
      vi.mocked(aiService.checkPollSafety).mockResolvedValue({ 
        allowed: false, 
        reason: 'Hate speech violation' 
      });

      const poll = await prisma.poll.create({
        data: {
          creatorId: testUserId,
          title: 'Bad Content Async',
          description: 'Violating content description',
          status: 'ACTIVE',
          moderation: {
            create: {
              status: 'PENDING',
              nextRetryAt: new Date(),
            },
          },
        },
      });

      // Act
      await processPendingModerations();

      // Assertions
      const updatedPoll = await prisma.poll.findUnique({ 
        where: { id: poll.id },
        include: { moderation: true }
      });
      
      expect(updatedPoll?.status).toBe('ARCHIVED');
      expect(updatedPoll?.moderation?.status).toBe('REJECTED');
      expect(updatedPoll?.moderation?.rejectionReason).toContain('Hate speech');

      // Verify notification creation
      const notification = await prisma.notification.findFirst({
        where: { pollId: poll.id }
      });
      expect(notification).toBeDefined();
      expect(notification?.type).toBe('POLL_REJECTED');
    });

    it('should increment retry counter and set exponential backoff on AI error', async () => {
      // Arrange: AI fails again
      vi.mocked(aiService.checkPollSafety).mockRejectedValue(new Error('Network still down'));

      const poll = await prisma.poll.create({
        data: {
          creatorId: testUserId,
          title: 'Persistence Test',
          description: 'Testing background persistence',
          moderation: {
            create: {
              status: 'PENDING',
              retryCount: 0,
              nextRetryAt: new Date(),
            },
          },
        },
      });

      // Act
      await processPendingModerations();

      // Assert
      const mod = await prisma.pollModeration.findUnique({ where: { pollId: poll.id } });
      expect(mod?.status).toBe('PENDING');
      expect(mod?.retryCount).toBe(1); // Incremented
      
      // Expected interval for count=1 is 20 minutes
      const expectedNext = Date.now() + 20 * 60 * 1000;
      const actualNext = mod?.nextRetryAt?.getTime() || 0;
      expect(Math.abs(actualNext - expectedNext)).toBeLessThan(10000); // tolerant check
    });
  });
});

