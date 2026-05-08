import { prisma } from '../../config/database';
import { CreatePollInput, UpdatePollInput } from './polls.schema';
import { generateSignedUrl } from '../../lib/s3';
import { withCache, invalidateCache } from '../../lib/cache';

/**
 * Helper function to convert poll coverImage URL to signed URL if it exists
 */
const enrichPollWithSignedUrl = async (poll: any) => {
  if (poll.coverImage && poll.coverImage.startsWith('https://')) {
    poll.coverImage = await generateSignedUrl(poll.coverImage);
  }
  return poll;
};

/**
 * Helper function to enrich multiple polls with signed URLs
 */
const enrichPollsWithSignedUrls = async (polls: any[]) => {
  return Promise.all(polls.map(enrichPollWithSignedUrl));
};

export const createPoll = async (creatorId: string, input: CreatePollInput) => {
  const poll = await prisma.poll.create({
    data: {
      creatorId,
      title: input.title,
      description: input.description,
      visibility: input.visibility || 'PUBLIC',
      status: input.status || 'ACTIVE',
      category: input.category,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      questions: {
        create: input.questions.map((q, qIdx) => ({
          text: q.text,
          order: qIdx,
          options: {
            create: q.options.map((opt, oIdx) => ({
              text: opt.text,
              order: oIdx,
            })),
          },
        })),
      },
    },
    include: {
      questions: {
        include: {
          options: true,
        },
      },
    },
  });

  return poll;
};

export const getPolls = async (filters: {
  page?: number;
  limit?: number;
  status?: any;
  category?: string;
  visibility?: any;
  showDeleted?: boolean;
}) => {
  const page = Number(filters.page) || 1;
  const limit = Number(filters.limit) || 20;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (!filters.showDeleted) {
    where.deletedAt = null;
  } else {
    where.deletedAt_bypass = true;
  }

  if (filters.status) where.status = filters.status;
  if (filters.category) where.category = filters.category;
  if (filters.visibility) where.visibility = filters.visibility;

  const [polls, total] = await Promise.all([
    prisma.poll.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.poll.count({ where }),
  ]);

  const enrichedPolls = await enrichPollsWithSignedUrls(polls);

  return {
    polls: enrichedPolls,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getPollById = async (id: string) => {
  return withCache(`poll:${id}`, 300, async () => {
    const poll = await prisma.poll.findFirst({
      where: { id, deletedAt: null },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!poll) {
      throw new Error('Poll not found or has been deleted');
    }

    return enrichPollWithSignedUrl(poll);
  });
};

export const updatePoll = async (id: string, creatorId: string, input: UpdatePollInput) => {
  const poll = await prisma.poll.findFirst({
    where: { id, deletedAt: null },
  });

  if (!poll) {
    throw new Error('Poll not found');
  }

  if (poll.creatorId !== creatorId) {
    throw new Error('You do not have permission to update this poll');
  }

  if (poll.status === 'CLOSED') {
    throw new Error('Closed polls cannot be edited');
  }

  // Active polls: restrict editable fields to only allow description, visibility, and expiresAt
  const data: any = {
    title: poll.status === 'ACTIVE' ? poll.title : input.title,
    description: input.description,
    visibility: input.visibility,
    status: poll.status === 'ACTIVE' ? poll.status : input.status,
    category: poll.status === 'ACTIVE' ? poll.category : input.category,
    expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
  };

  const updatedPoll = await prisma.poll.update({
    where: { id },
    data,
    include: {
      questions: {
        include: {
          options: true,
        },
      },
    },
  });

  await invalidateCache(`poll:${id}`);
  await invalidateCache('poll:featured');
  await invalidateCache('polls:trending:5');
  await invalidateCache('polls:trending:10');

  return updatedPoll;
};

export const deletePoll = async (id: string, creatorId: string) => {
  const poll = await prisma.poll.findFirst({
    where: { id, deletedAt: null },
  });

  if (!poll) {
    throw new Error('Poll not found');
  }

  if (poll.creatorId !== creatorId) {
    throw new Error('You do not have permission to delete this poll');
  }

  await prisma.poll.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
  });

  await invalidateCache(`poll:${id}`);
  await invalidateCache('poll:featured');
  await invalidateCache('polls:trending:5');
  await invalidateCache('polls:trending:10');
};

export const getMyPolls = async (creatorId: string, filters: {
  page?: number;
  limit?: number;
  status?: any;
  showDeleted?: boolean;
}) => {
  const page = Number(filters.page) || 1;
  const limit = Number(filters.limit) || 20;
  const skip = (page - 1) * limit;

  const where: any = {
    creatorId,
  };

  if (!filters.showDeleted) {
    where.deletedAt = null;
  } else {
    where.deletedAt_bypass = true;
  }

  if (filters.status) where.status = filters.status;

  const [polls, total] = await Promise.all([
    prisma.poll.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
        _count: {
          select: {
            votes: true,
          },
        },
      },
    }),
    prisma.poll.count({ where }),
  ]);

  const enrichedPolls = await enrichPollsWithSignedUrls(polls.map(p => ({
    ...p,
    totalVotes: p._count.votes,
  })));

  return {
    polls: enrichedPolls,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const publishPoll = async (id: string, creatorId: string) => {
  const poll = await prisma.poll.findFirst({
    where: { id, creatorId, deletedAt: null },
    include: {
      questions: {
        include: {
          options: true,
        },
      },
    },
  });

  if (!poll) {
    throw new Error('Poll not found');
  }

  if (poll.status !== 'DRAFT') {
    throw new Error('Only draft polls can be published');
  }

  // Basic question and option counts check
  if (!poll.questions.length || poll.questions.some(q => q.options.length < 2)) {
    throw new Error('Poll must have at least one question with two or more options to be published');
  }

  const updatedPoll = await prisma.poll.update({
    where: { id },
    data: {
      status: 'ACTIVE',
      publishedAt: new Date(),
    },
  });

  await invalidateCache(`poll:${id}`);
  await invalidateCache('poll:featured');
  await invalidateCache('polls:trending:5');
  await invalidateCache('polls:trending:10');

  return updatedPoll;
};

export const closePoll = async (id: string, creatorId: string) => {
  const poll = await prisma.poll.findFirst({
    where: { id, creatorId, deletedAt: null },
  });

  if (!poll) {
    throw new Error('Poll not found');
  }

  if (poll.status !== 'ACTIVE') {
    throw new Error('Only active polls can be closed');
  }

  const updatedPoll = await prisma.poll.update({
    where: { id },
    data: {
      status: 'CLOSED',
    },
  });

  await invalidateCache(`poll:${id}`);
  await invalidateCache('poll:featured');
  await invalidateCache('polls:trending:5');
  await invalidateCache('polls:trending:10');

  return updatedPoll;
};

export const getFeaturedPoll = async () => {
  return withCache('poll:featured', 60, async () => {
    const polls = await prisma.poll.findMany({
      where: {
        status: 'ACTIVE',
        visibility: 'PUBLIC',
        deletedAt: null,
      },
      orderBy: {
        votes: {
          _count: 'desc',
        },
      },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
        _count: {
          select: {
            votes: true,
          },
        },
      },
    });

    const poll = polls.find((p) => p._count.votes >= 3);

    if (!poll) return null;

    const enrichedPoll = await enrichPollWithSignedUrl({
      ...poll,
      totalVotes: poll._count.votes,
    });

    return enrichedPoll;
  });
};

export const startAiValidation = async (pollId: string, userId: string) => {
  const poll = await prisma.poll.findFirst({
    where: { id: pollId, creatorId: userId, deletedAt: null },
    select: { id: true },
  });

  if (!poll) {
    throw new Error('Poll not found');
  }

  const aiInsight = await prisma.aiInsight.upsert({
    where: { pollId },
    create: {
      pollId,
      status: 'PENDING',
    },
    update: {
      status: 'PENDING',
      errorMessage: null,
    },
    select: {
      status: true,
      updatedAt: true,
    },
  });

  // Fire off background worker asynchronously (non-blocking)
  // This will transition the status without blocking the response
  simulateAiValidationBackground(pollId);

  return aiInsight;
};

/**
 * Background worker that performs AI validation with real web search
 * Transitions status: PENDING -> PROCESSING -> COMPLETED
 */
const simulateAiValidationBackground = async (pollId: string) => {
  try {
    // Import here to avoid circular dependencies
    const { fetchTavilySearch } = await import('../../services/ai.service');

    // Get poll details for search context
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      select: {
        title: true,
        description: true,
        category: true,
      },
    });

    if (!poll) {
      throw new Error('Poll not found');
    }

    // Wait 2 seconds, then transition to PROCESSING
    await new Promise(resolve => setTimeout(resolve, 2000));
    await prisma.aiInsight.update({
      where: { pollId },
      data: { status: 'PROCESSING' },
    });

    // Construct search query from poll context
    const searchQuery = `${poll.title} ${poll.description} market research ${poll.category || ''}`;

    // Fetch real Tavily search results
    const sources = await fetchTavilySearch(searchQuery);

    // Wait 8 more seconds (10 total), then transition to COMPLETED with sources
    await new Promise(resolve => setTimeout(resolve, 8000));
    await prisma.aiInsight.update({
      where: { pollId },
      data: {
        status: 'COMPLETED',
        sources: sources.length > 0 ? sources : null,
      },
    });
  } catch (error) {
    console.error(`Error in AI validation background worker for poll ${pollId}:`, error);
    // Update status to FAILED if something goes wrong
    try {
      await prisma.aiInsight.update({
        where: { pollId },
        data: {
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Background worker encountered an error',
        },
      });
    } catch (_err) {
      console.error(`Failed to update AI insight status to FAILED for poll ${pollId}`);
    }
  }
};


export const getAiValidationStatus = async (pollId: string, userId: string) => {
  const poll = await prisma.poll.findFirst({
    where: { id: pollId, creatorId: userId, deletedAt: null },
    select: { id: true },
  });

  if (!poll) {
    throw new Error('Poll not found');
  }

  const aiInsight = await prisma.aiInsight.findUnique({
    where: { pollId },
    select: {
      id: true,
      status: true,
      score: true,
      summary: true,
      simulatedVotes: true,
      personaFeedback: true,
      sources: true,
      errorMessage: true,
      updatedAt: true,
    },
  });

  return aiInsight;
};
