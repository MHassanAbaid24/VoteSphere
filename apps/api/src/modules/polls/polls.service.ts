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

  const updatedPoll = await prisma.poll.update({
    where: { id },
    data: {
      title: input.title,
      description: input.description,
      visibility: input.visibility,
      status: input.status,
      category: input.category,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
    },
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
