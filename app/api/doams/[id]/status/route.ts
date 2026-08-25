import { auth } from '@/auth';
import { changeStatus } from '@/lib/services/doams';
import { apiError } from '@/lib/services/api';
import { z } from 'zod';

const input = z.object({ status: z.enum(['PUBLISHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED']) });

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHENTICATED', 'Sign in required.', 401);
  const parsed = input.safeParse(await request.json());
  if (!parsed.success) return apiError('VALIDATION_ERROR', 'Invalid status.', 400);
  try {
    const { id } = await context.params;
    return Response.json(await changeStatus(session.user.id, id, parsed.data.status));
  } catch (error) {
    return apiError('STATE_CHANGE_FAILED', error instanceof Error ? error.message : 'Unable to update the DoAm.', 409);
  }
}
