import { auth } from '@/auth';
import { rateTask } from '@/lib/services/tasks';
import { taskRatingSchema } from '@/lib/validation/tasks';
import { apiError } from '@/lib/services/api';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHENTICATED', 'Sign in required.', 401);
  const parsed = taskRatingSchema.safeParse(await request.json());
  if (!parsed.success) return apiError('VALIDATION_ERROR', 'Provide a rating from 1 to 5.', 400);
  try {
    return Response.json(await rateTask(session.user.id, (await params).id, parsed.data.score, parsed.data.review));
  } catch (error) {
    return apiError('RATING_FAILED', error instanceof Error ? error.message : 'Unable to save your review.', 409);
  }
}