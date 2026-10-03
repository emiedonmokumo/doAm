import { auth } from '@/auth';
import { apiError } from '@/lib/services/api';
import { createTask } from '@/lib/services/tasks';
import { createTaskSchema } from '@/lib/validation/tasks';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHENTICATED', 'Sign in required.', 401);
  const parsed = createTaskSchema.safeParse(await request.json());
  if (!parsed.success) return apiError('VALIDATION_ERROR', 'Check the task details and try again.', 400);
  try {
    const { task, handshakePin } = await createTask(session.user.id, parsed.data);
    return Response.json({ task: { id: task.id, status: task.status }, handshake_pin: handshakePin }, { status: 201 });
  } catch {
    return apiError('TASK_CREATE_FAILED', 'Unable to create this task.', 400);
  }
}
