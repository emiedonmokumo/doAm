import { auth } from '@/auth';
import { db } from '@/lib/db';
import { apiError } from '@/lib/services/api';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHENTICATED', 'Sign in required.', 401);
  const notifications = await db.notification.findMany({ where: { recipientId: session.user.id }, orderBy: { createdAt: 'desc' }, take: 50 });
  return Response.json({ notifications: notifications.map((item) => ({ id: item.id, type: item.type, title: item.title, body: item.body, entity_id: item.entityId, read_at: item.readAt?.toISOString() ?? null, created_at: item.createdAt.toISOString() })) });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHENTICATED', 'Sign in required.', 401);
  const body = await request.json().catch(() => ({}));
  await db.notification.updateMany({ where: { recipientId: session.user.id, ...(body.id ? { id: String(body.id) } : {}), readAt: null }, data: { readAt: new Date() } });
  return Response.json({ ok: true });
}
