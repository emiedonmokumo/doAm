import { z } from 'zod';

export const createDoAmSchema = z.object({
  title: z.string().trim().min(3).max(120), description: z.string().trim().max(2000).optional(),
  reward: z.coerce.number().positive().max(10_000_000), category: z.string().trim().max(50).optional(),
  latitude: z.coerce.number().gte(-90).lte(90), longitude: z.coerce.number().gte(-180).lte(180),
  city: z.string().trim().min(2).max(80), region: z.string().trim().min(2).max(80),
  approximateAddress: z.string().trim().max(160).optional(), instructions: z.string().trim().max(1000).optional(), scheduledAt: z.coerce.date().optional(),
  recurrence: z.enum(['DAILY', 'WEEKLY', 'SELECTED_DAYS']).optional(), isMultiPerson: z.boolean().optional(),
  maxParticipants: z.coerce.number().int().min(1).max(20).optional(), status: z.enum(['DRAFT', 'PUBLISHED']).default('PUBLISHED'),
});
