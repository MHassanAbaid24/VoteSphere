import { z } from 'zod';

export const CastVoteSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().trim(),
        optionId: z.string().trim(),
      })
    )
    .min(1),
});

export type CastVoteInput = z.infer<typeof CastVoteSchema>;
