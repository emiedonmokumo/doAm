import { auth } from '@/auth';
import { db } from '@/lib/db';
import { apiError } from '@/lib/services/api';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHENTICATED', 'Sign in required.', 401);
  const userId = session.user.id;
  const tasks = await db.task.findMany({
    where: { OR: [{ posterId: userId }, { runnerId: userId }] },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true, title: true, category: true, runnerFee: true, status: true,
      posterId: true, runnerId: true,
      images: { select: { url: true }, take: 1, orderBy: { order: 'asc' } },
    },
  });
  return Response.json({ tasks: tasks.map((task) => ({
    id: task.id,
    title: task.title,
    category: task.category,
    runner_fee: Number(task.runnerFee),
    status: task.status,
    role: task.posterId === userId ? 'POSTER' : 'RUNNER',
    imageUrl: task.images[0]?.url ?? null,
  })) });
}