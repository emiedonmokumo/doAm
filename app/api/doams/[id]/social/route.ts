import { auth } from '@/auth';
import { db } from '@/lib/db';
import { apiError } from '@/lib/services/api';
import { submitRating } from '@/lib/services/doams';
import { z } from 'zod';

const input = z.discriminatedUnion('action', [
  z.object({ action: z.enum(['like', 'unlike', 'save', 'unsave']) }),
  z.object({ action: z.literal('comment'), content: z.string().trim().min(1).max(1000) }),
  z.object({ action: z.literal('rate'), rated_user_id: z.string().min(1), score: z.number().int().min(1).max(5), review: z.string().trim().max(1000).optional() }),
]);

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHENTICATED', 'Sign in required.', 401);
  const { id } = await context.params;
  const parsed = input.safeParse(await request.json());
  if (!parsed.success) return apiError('VALIDATION_ERROR', 'Invalid action.', 400);
  const actorId = session.user.id;
  const doam = await db.doAm.findUnique({ where: { id }, include: { applications: true } });
  if (!doam) return apiError('NOT_FOUND', 'This DoAm no longer exists.', 404);
  if (parsed.data.action === 'like') await db.like.upsert({ where: { doamId_userId: { doamId: id, userId: actorId } }, create: { doamId: id, userId: actorId }, update: {} });
  if (parsed.data.action === 'unlike') await db.like.deleteMany({ where: { doamId: id, userId: actorId } });
  if (parsed.data.action === 'save') await db.savedDoAm.upsert({ where: { doamId_userId: { doamId: id, userId: actorId } }, create: { doamId: id, userId: actorId }, update: {} });
  if (parsed.data.action === 'unsave') await db.savedDoAm.deleteMany({ where: { doamId: id, userId: actorId } });
  if (parsed.data.action === 'comment') await db.comment.create({ data: { doamId: id, userId: actorId, content: parsed.data.content } });
  if (parsed.data.action === 'rate') try { await submitRating(actorId, id, parsed.data.rated_user_id, parsed.data.score, parsed.data.review); }
  catch (error) { return apiError('RATING_FAILED', error instanceof Error ? error.message : 'Unable to save your review.', 409); }
  const counts = await db.doAm.findUniqueOrThrow({ where: { id }, select: { _count: { select: { likes: true, comments: true } } } });
  return Response.json({ ok: true, like_count: counts._count.likes, comment_count: counts._count.comments });
}
