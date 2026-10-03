import { auth } from '@/auth';
import { generateTaskPin } from '@/lib/services/tasks';
import { apiError } from '@/lib/services/api';

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHENTICATED', 'Sign in required.', 401);
  const { id } = await params;
  try {
    const result = await generateTaskPin(session.user.id, id);
    return Response.json({ handshake_pin: result.handshakePin });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to generate handover PIN.';
    return apiError('PIN_GENERATE_FAILED', message, 400);
  }
}
