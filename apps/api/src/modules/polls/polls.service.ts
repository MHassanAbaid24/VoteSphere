import { prisma } from '../../config/database';
import { CreatePollInput, UpdatePollInput } from './polls.schema';

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
}) => {
  const page = Number(filters.page) || 1;
  const limit = Number(filters.limit) || 20;
  const skip = (page - 1) * limit;

  const where: any = {
    deletedAt: null,
  };

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

export const getPollById = async (id: string) => {
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

  return poll;
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
};

export const getMyPolls = async (creatorId: string, filters: {
  page?: number;
  limit?: number;
  status?: any;
}) => {
  const page = Number(filters.page) || 1;
  const limit = Number(filters.limit) || 20;
  const skip = (page - 1) * limit;

  const where: any = {
    creatorId,
    deletedAt: null,
  };

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

  return {
    polls: polls.map(p => ({
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

  return updatedPoll;
};
