import { auth } from '@/auth';
import { findTasksNearRunner } from '@/lib/repositories/location';
import { apiError } from '@/lib/services/api';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHENTICATED', 'Sign in required.', 401);
  const tasks = await findTasksNearRunner(session.user.id);
  if (!tasks) return apiError('LOCATION_REQUIRED', 'Add an approximate location to your profile to see nearby tasks.', 422);
  return Response.json({ tasks, radius_km: 10 });
}
