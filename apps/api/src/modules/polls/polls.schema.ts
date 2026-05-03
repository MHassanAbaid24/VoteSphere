import { z } from 'zod';

export const CreatePollSchema = z.object({
  title: z.string().min(5).max(200).trim(),
  description: z.string().min(10).max(2000).trim(),
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'UNLISTED']).default('PUBLIC'),
  status: z.enum(['DRAFT', 'ACTIVE', 'CLOSED', 'ARCHIVED']).default('ACTIVE'),
  category: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
  questions: z
    .array(
      z.object({
        text: z.string().min(1).max(500).trim(),
        options: z
          .array(
            z.object({
              text: z.string().min(1).max(200).trim(),
            })
          )
          .min(2)
          .max(10),
      })
    )
    .min(1)
    .max(20),
});

export const UpdatePollSchema = CreatePollSchema.partial();

export type CreatePollInput = z.infer<typeof CreatePollSchema>;
export type UpdatePollInput = z.infer<typeof UpdatePollSchema>;
