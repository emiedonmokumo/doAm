import { auth } from '@/auth';
import { db } from '@/lib/db';
import { apiError } from '@/lib/services/api';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHENTICATED', 'Sign in required.', 401);
  const { id } = await params;
  const task = await db.task.findUnique({ where: { id }, include: {
    events: { orderBy: { createdAt: 'asc' }, select: { type: true, createdAt: true } },
    conversation: { select: { id: true } },
    ratings: { where: { raterId: session.user.id }, select: { id: true } },
    images: { select: { id: true, url: true, order: true }, orderBy: { order: 'asc' } },
  } });
  if (!task) return apiError('NOT_FOUND', 'Task not found.', 404);
  const participant = session.user.id === task.posterId || session.user.id === task.runnerId;
  return Response.json({ task: {
    id: task.id, title: task.title, description: task.description, category: task.category,
    runner_fee: Number(task.runnerFee), estimated_expenses: Number(task.estimatedExpenses), settlement_method: task.settlementMethod,
    status: task.status, pickup_area: task.pickupApproximateArea, pickup_city: task.pickupCity, pickup_region: task.pickupRegion,
    dropoff_area: task.dropoffApproximateArea, dropoff_city: task.dropoffCity, dropoff_region: task.dropoffRegion,
    proof_url: participant ? task.proofUrl : null, is_poster: session.user.id === task.posterId, is_runner: session.user.id === task.runnerId,
    images: task.images ?? [],
    conversation_id: participant ? task.conversation?.id ?? null : null,
    can_rate: task.status === 'COMPLETED' && participant && Boolean(task.runnerId),
    has_rated: task.ratings.length > 0,
    rated_user_id: task.status === 'COMPLETED' && participant
      ? session.user.id === task.posterId ? task.runnerId : task.posterId
      : null,
    events: task.events,
  } });
}
