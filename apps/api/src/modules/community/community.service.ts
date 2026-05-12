import { prisma } from '../../config/database';
import { withCache } from '../../lib/cache';

export const getCategories = () => {
  return ['Technology', 'Sports', 'Politics', 'Entertainment', 'Science', 'Business', 'Health', 'Education', 'Other'];
};

export const getFeed = async (filters: { page?: number; limit?: number; userId?: string }) => {
  const page = Number(filters.page) || 1;
  const limit = Number(filters.limit) || 20;
  const skip = (page - 1) * limit;

  // 1. Fetch user's preferred categories if userId is provided
  let preferredCategories: string[] = [];
  if (filters.userId) {
    const prefs = await prisma.userPreferences.findUnique({
      where: { userId: filters.userId },
    });
    if (prefs && prefs.categories) {
      preferredCategories = prefs.categories;
    }
  }

  // 2. Fetch all matching active polls
  const [polls, total] = await Promise.all([
    prisma.poll.findMany({
      where: {
        deletedAt: null,
        status: 'ACTIVE',
        visibility: 'PUBLIC',
      },
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
    prisma.poll.count({
      where: {
        deletedAt: null,
        status: 'ACTIVE',
        visibility: 'PUBLIC',
      },
    }),
  ]);

  // 3. Score and sort polls if preferredCategories are specified
  const enrichedPolls = polls.map((p) => {
    const isPreferred = p.category && preferredCategories.includes(p.category);
    // Score formula: matching preferred category gets 2.5x score boost
    const score = (p.totalVotes + 1) * (isPreferred ? 2.5 : 1.0);
    return {
      ...p,
      score,
    };
  });

  // Sort by score first, then newest
  enrichedPolls.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Apply pagination in-memory
  const paginatedPolls = enrichedPolls.slice(skip, skip + limit);

  return {
    polls: paginatedPolls,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getTrending = async (limit: number = 10) => {
  return withCache(`polls:trending:${limit}`, 10, async () => {
    const polls = await prisma.poll.findMany({
      where: {
        deletedAt: null,
        status: 'ACTIVE',
        visibility: 'PUBLIC',
      },
      take: limit,
      orderBy: {
        totalVotes: 'desc',
      },
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

    return polls;
  });
};

export const search = async (filters: {
  q?: string;
  category?: string;
  page?: number;
  limit?: number;
}) => {
  const page = Number(filters.page) || 1;
  const limit = Number(filters.limit) || 20;
  const skip = (page - 1) * limit;

  const where: any = {
    deletedAt: null,
    status: 'ACTIVE',
    visibility: 'PUBLIC',
  };

  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q, mode: 'insensitive' } },
      { description: { contains: filters.q, mode: 'insensitive' } },
    ];
  }

  if (filters.category) {
    where.category = filters.category;
  }

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

  return {
    polls,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};
