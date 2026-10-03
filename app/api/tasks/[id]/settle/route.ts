import { auth } from '@/auth';
import { settleTask } from '@/lib/services/tasks';
import { settleTaskSchema } from '@/lib/validation/tasks';
import { apiError } from '@/lib/services/api';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHENTICATED', 'Sign in required.', 401);
  const parsed = settleTaskSchema.safeParse(await request.json());
  if (!parsed.success) return apiError('VALIDATION_ERROR', 'Enter the four digit handover PIN.', 400);
  try { return Response.json(await settleTask(session.user.id, (await params).id, parsed.data.pin)); }
  catch (error) { return apiError('SETTLEMENT_FAILED', error instanceof Error ? error.message : 'Unable to complete this task.', 409); }
}
