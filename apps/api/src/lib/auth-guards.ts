import { Context } from 'hono';

export class UnauthorizedError extends Error {
  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message: string = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

/**
 * Asserts that the authenticated user owns the resource being modified.
 */
export const assertOwnership = (resourceCreatorId: string, requestingUserId: string) => {
  if (resourceCreatorId !== requestingUserId) {
    throw new ForbiddenError('You do not have permission to access or modify this resource.');
  }
};

/**
 * Asserts that the authenticated user has a specific role or higher (e.g., ADMIN).
 */
export const assertRole = (userRole: string, requiredRole: string) => {
  const roles = ['USER', 'PREMIUM', 'ADMIN'];
  if (roles.indexOf(userRole) < roles.indexOf(requiredRole)) {
    throw new ForbiddenError(`This feature requires at least ${requiredRole} privileges.`);
  }
};

/**
 * Asserts that the user has premium or admin status.
 */
export const assertPremium = (isPremium: boolean, userRole: string) => {
  if (!isPremium && userRole !== 'ADMIN') {
    throw new ForbiddenError('This feature requires a Premium account.');
  }
};
