import { auth } from '@/auth';
import { findTasksNearRunner, findUsersNearRunner, getRunnerCenter } from '@/lib/repositories/location';
import { apiError } from '@/lib/services/api';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHENTICATED', 'Sign in required.', 401);
  const userId = session.user.id;
  const [tasks, nearbyUsers, userLocation] = await Promise.all([
    findTasksNearRunner(userId),
    findUsersNearRunner(userId),
    getRunnerCenter(userId),
  ]);
  if (!tasks || !userLocation) return apiError('LOCATION_REQUIRED', 'Add an approximate location to your profile to see nearby tasks.', 422);
  return Response.json({ tasks, nearbyUsers, userLocation, radius_km: 10 });
}
