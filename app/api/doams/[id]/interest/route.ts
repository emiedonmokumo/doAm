import { auth } from '@/auth';
import { apiError } from '@/lib/services/api';
import { expressInterest, withdrawInterest } from '@/lib/services/doams';

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHENTICATED', 'Sign in required.', 401);
  try { return Response.json(await expressInterest(session.user.id, (await context.params).id), { status: 201 }); }
  catch (error) { return apiError('INTEREST_FAILED', error instanceof Error ? error.message : 'Unable to offer help.', 409); }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHENTICATED', 'Sign in required.', 401);
  try { return Response.json(await withdrawInterest(session.user.id, (await context.params).id)); }
  catch (error) { return apiError('WITHDRAW_FAILED', error instanceof Error ? error.message : 'Unable to withdraw your offer.', 409); }
}
