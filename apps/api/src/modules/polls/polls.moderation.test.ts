import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { prisma } from '../../config/database';
import * as pollsService from './polls.service';
import * as aiService from '../../services/ai.service';

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
