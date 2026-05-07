import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

// Soft Delete Strategy (from PLAN.md 5.5)
prisma.$use(async (params, next) => {
  const modelsWithSoftDelete = ['User', 'Poll'];
  
  if (modelsWithSoftDelete.includes(params.model!)) {
    if (params.action === 'findMany' || params.action === 'findFirst') {
      // Automatically filter out soft-deleted records
      params.args = params.args || {};
      params.args.where = params.args.where || {};
      
      // Check for the bypass flag inside the where object
      if (params.args.where.deletedAt_bypass === true) {
        delete params.args.where.deletedAt_bypass;
      } else if (params.args.where.deletedAt === undefined) {
        params.args.where.deletedAt = null;
      }
    }
  }
  
  return next(params);
});
