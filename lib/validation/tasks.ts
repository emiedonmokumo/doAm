import { z } from 'zod';

const location = z.object({
  latitude: z.coerce.number().gte(-90).lte(90), longitude: z.coerce.number().gte(-180).lte(180),
  city: z.string().trim().min(2).max(80), region: z.string().trim().min(2).max(80), approximateArea: z.string().trim().min(2).max(160),
});

export const createTaskSchema = z.object({
  title: z.string().trim().min(3).max(120), description: z.string().trim().max(2000).optional(),
  category: z.enum(['PICKUP_DELIVERY', 'QUEUEING', 'FAVOR', 'QUICK_REPAIR']),
  runnerFee: z.coerce.number().positive().max(10_000_000), estimatedExpenses: z.coerce.number().nonnegative().max(10_000_000),
  settlementMethod: z.enum(['CASH_ON_DELIVERY', 'DIRECT_TRANSFER']), pickup: location,
  dropoff: location.optional(),
}).superRefine((input, ctx) => {
  if (input.category === 'PICKUP_DELIVERY' && !input.dropoff) ctx.addIssue({ code: 'custom', path: ['dropoff'], message: 'Pickup and Delivery tasks need a drop-off location.' });
  if (input.category !== 'PICKUP_DELIVERY' && input.dropoff) ctx.addIssue({ code: 'custom', path: ['dropoff'], message: 'A drop-off location is only used for Pickup and Delivery tasks.' });
});

export const taskMilestoneSchema = z.object({ action: z.enum(['EN_ROUTE_PICKUP', 'ARRIVED_PICKUP', 'EN_ROUTE_DROPOFF', 'ARRIVED_DROPOFF']) });
export const settleTaskSchema = z.object({ pin: z.string().regex(/^\d{4}$/) });
export const taskRatingSchema = z.object({
  score: z.number().int().min(1).max(5),
  review: z.string().trim().max(1000).optional(),
});