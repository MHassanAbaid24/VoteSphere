import { z } from 'zod';

export const GetNotificationsSchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  unreadOnly: z.string().optional().transform(val => val === 'true'),
});

export type GetNotificationsInput = z.infer<typeof GetNotificationsSchema>;
