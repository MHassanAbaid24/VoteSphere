import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

// Soft Delete Strategy (from PLAN.md 5.5)
prisma.$use(async (params, next) => {
  const modelsWithSoftDelete = ['User', 'Poll'];
  
  if (modelsWithSoftDelete.includes(params.model!)) {
    if (params.action === 'findMany' || params.action === 'findFirst') {
      // Automatically filter out soft-deleted records
      params.args.where = { ...params.args.where, deletedAt: null };
    }
  }
  
  return next(params);
});
