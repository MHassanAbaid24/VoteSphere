import { prisma } from '../../config/database';
import { withCache } from '../../lib/cache';

export const getCategories = () => {
  return ['Technology', 'Sports', 'Politics', 'Entertainment', 'Science', 'Business', 'Other'];
};

export const getFeed = async (filters: { page?: number; limit?: number }) => {
  const page = Number(filters.page) || 1;
  const limit = Number(filters.limit) || 20;
  const skip = (page - 1) * limit;

  const [polls, total] = await Promise.all([
    prisma.poll.findMany({
      where: {
        deletedAt: null,
        status: 'ACTIVE',
        visibility: 'PUBLIC',
      },
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
        _count: {
          select: {
            votes: true,
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

  return {
    polls: polls.map((p) => ({
      ...p,
      totalVotes: p._count.votes,
    })),
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
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            votes: true,
          },
        },
      },
    });

    return polls.map((p) => ({
      ...p,
      totalVotes: p._count.votes,
    }));
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
        _count: {
          select: {
            votes: true,
          },
        },
      },
    }),
    prisma.poll.count({ where }),
  ]);

  return {
    polls: polls.map((p) => ({
      ...p,
      totalVotes: p._count.votes,
    })),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};
