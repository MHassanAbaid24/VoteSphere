/**
 * High-performance password hashing using Bun's native password hashing.
 * Supports bcrypt underneath natively.
 */

export const hashPassword = async (password: string): Promise<string> => {
  return await (globalThis as any).Bun.password.hash(password, {
    algorithm: 'bcrypt',
    cost: 10
  });
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await (globalThis as any).Bun.password.verify(password, hash);
};
