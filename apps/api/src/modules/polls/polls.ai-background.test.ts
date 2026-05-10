import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { prisma } from '../../config/database';
import * as pollsService from './polls.service';

describe('AI Background Worker', () => {
  const testPollId = 'test-poll-id';
  const testUserId = 'test-user-id';

  beforeEach(async () => {
    // Clean up test data
    await prisma.aiInsight.deleteMany({});
    await prisma.vote.deleteMany({});
    await prisma.question.deleteMany({});
    await prisma.poll.deleteMany({});
    await prisma.user.deleteMany({});

    // Create test user
    await prisma.user.create({
      data: {
        id: testUserId,
        email: 'test@example.com',
        name: 'Test User',
      },
    });

    // Create test poll
    await prisma.poll.create({
      data: {
        id: testPollId,
        creatorId: testUserId,
        title: 'Test Poll',
        description: 'Test Description',
        status: 'ACTIVE',
        visibility: 'PUBLIC',
        category: 'TECHNOLOGY',
        questions: {
          create: [
            {
              text: 'Question 1?',
              order: 0,
              options: {
                create: [
                  { text: 'Option 1', order: 0 },
                  { text: 'Option 2', order: 1 },
                ],
              },
            },
          ],
        },
      },
    });
  });

  afterEach(async () => {
    await prisma.aiInsight.deleteMany({});
    await prisma.vote.deleteMany({});
    await prisma.question.deleteMany({});
    await prisma.poll.deleteMany({});
    await prisma.user.deleteMany({});
  });

  it('should start AI validation with PENDING status', async () => {
    const result = await pollsService.startAiValidation(testPollId, testUserId);
    expect(result.status).toBe('PENDING');
  });

  it('should fire background worker asynchronously without blocking request', async () => {
    const startTime = Date.now();
    const result = await pollsService.startAiValidation(testPollId, testUserId);
    const duration = Date.now() - startTime;

    // Should return immediately (< 100ms)
    expect(duration).toBeLessThan(100);
    expect(result.status).toBe('PENDING');
  });

  it(
    'should transition status from PENDING to PROCESSING after 2 seconds',
    {
      timeout: 5000,
    },
    async () => {
      // Start validation
      await pollsService.startAiValidation(testPollId, testUserId);

      // Check initial status
      let status = await pollsService.getAiValidationStatus(testPollId, testUserId);
      expect(status?.status).toBe('PENDING');

      // Wait for transition
      await new Promise(resolve => setTimeout(resolve, 2500));

      // Check status transitioned to PROCESSING
      status = await pollsService.getAiValidationStatus(testPollId, testUserId);
      expect(status?.status).toBe('PROCESSING');
    }
  );

  it(
    'should transition status from PROCESSING to COMPLETED after 8-10 seconds total',
    {
      timeout: 12000,
    },
    async () => {
      // Start validation
      await pollsService.startAiValidation(testPollId, testUserId);

      // Check initial status
      let status = await pollsService.getAiValidationStatus(testPollId, testUserId);
      expect(status?.status).toBe('PENDING');

      // Wait for completion
      await new Promise(resolve => setTimeout(resolve, 10500));

      // Check status transitioned to COMPLETED
      status = await pollsService.getAiValidationStatus(testPollId, testUserId);
      expect(status?.status).toBe('COMPLETED');
    }
  );
});

