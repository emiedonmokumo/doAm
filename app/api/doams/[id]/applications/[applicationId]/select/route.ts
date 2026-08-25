import { auth } from '@/auth';
import { apiError } from '@/lib/services/api';
import { selectHelper } from '@/lib/services/doams';

export async function POST(_: Request, context: { params: Promise<{ id: string; applicationId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHENTICATED', 'Sign in required.', 401);
  const { id, applicationId } = await context.params;
  try { return Response.json(await selectHelper(session.user.id, id, applicationId)); }
  catch (error) { return apiError('SELECTION_FAILED', error instanceof Error ? error.message : 'Unable to choose this helper.', 409); }
}
