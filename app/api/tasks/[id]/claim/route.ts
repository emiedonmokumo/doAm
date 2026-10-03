import { auth } from '@/auth';
import { claimTask } from '@/lib/services/tasks';
import { apiError } from '@/lib/services/api';

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHENTICATED', 'Sign in required.', 401);
  try { return Response.json(await claimTask(session.user.id, (await params).id)); }
  catch (error) { return apiError('CLAIM_FAILED', error instanceof Error ? error.message : 'Unable to claim this task.', 409); }
}
