import { auth } from '@/auth';
import { TaskStatus } from '@prisma/client';
import { advanceTask } from '@/lib/services/tasks';
import { taskMilestoneSchema } from '@/lib/validation/tasks';
import { apiError } from '@/lib/services/api';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHENTICATED', 'Sign in required.', 401);
  const parsed = taskMilestoneSchema.safeParse(await request.json());
  if (!parsed.success) return apiError('VALIDATION_ERROR', 'Invalid task milestone.', 400);
  try { return Response.json(await advanceTask(session.user.id, (await params).id, parsed.data.action as TaskStatus)); }
  catch (error) { return apiError('MILESTONE_FAILED', error instanceof Error ? error.message : 'Unable to update task.', 409); }
}
