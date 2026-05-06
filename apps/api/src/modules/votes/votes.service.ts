import { prisma } from '../../config/database';
import { invalidateCache } from '../../lib/cache';

export const castVote = async (pollId: string, userId: string, answers: { questionId: string; optionId: string }[]) => {
  // 1. Fetch poll (throw on missing/soft-deleted)
  const poll = await prisma.poll.findFirst({
    where: { id: pollId, deletedAt: null },
    include: {
      questions: {
        include: {
          options: true,
        },
      },
    },
  });

  if (!poll) {
    throw new Error('POLL_NOT_FOUND');
  }

  // 2. Check if the poll is ACTIVE
  if (poll.status !== 'ACTIVE') {
    throw new Error('POLL_CLOSED');
  }

  // 3. Creator cannot vote on their own poll
  if (poll.creatorId === userId) {
    throw new Error('CREATOR_CANNOT_VOTE');
  }

  // 4. Validate all question IDs and options belong to this poll
  const validQuestions = new Map<string, Set<string>>();
  for (const q of poll.questions) {
    validQuestions.set(q.id, new Set(q.options.map((o: any) => o.id)));
  }

  for (const ans of answers) {
    if (!validQuestions.has(ans.questionId)) {
      throw new Error('INVALID_QUESTION');
    }
    if (!validQuestions.get(ans.questionId)!.has(ans.optionId)) {
      throw new Error('INVALID_OPTION');
    }
  }

  // 5. De-duplication check: check if the user has already voted on ANY question of this poll
  const existingVote = await prisma.vote.findFirst({
    where: {
      pollId,
      userId,
    },
  });

  if (existingVote) {
    throw new Error('ALREADY_VOTED');
  }

  // 6. Execute vote insertion and counter increments atomically in a transaction
  await prisma.$transaction(async (tx: any) => {
    for (const ans of answers) {
      try {
        await tx.vote.create({
          data: {
            pollId,
            questionId: ans.questionId,
            optionId: ans.optionId,
            userId,
          },
        });
      } catch (err: any) {
        if (err.code === 'P2002') {
          throw new Error('ALREADY_VOTED');
        }
        throw err;
      }

      await tx.pollOption.update({
        where: { id: ans.optionId },
        data: { votes: { increment: 1 } },
      });
    }

    await tx.poll.update({
      where: { id: pollId },
      data: { totalVotes: { increment: 1 } },
    });
  });

  await invalidateCache(`poll:${pollId}`);
  await invalidateCache('poll:featured');
  await invalidateCache('polls:trending:5');
  await invalidateCache('polls:trending:10');

  return { message: 'Vote cast successfully' };
};

export const getVoteStatus = async (pollId: string, userId: string) => {
  const votes = await prisma.vote.findMany({
    where: {
      pollId,
      userId,
    },
  });

  const hasVoted = votes.length > 0;
  const votedOptionIds = votes.map((v: any) => v.optionId);

  return {
    hasVoted,
    votedOptionIds,
  };
};
