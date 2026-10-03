import { auth } from '@/auth';
import { db } from '@/lib/db';
import { apiError } from '@/lib/services/api';
import { z } from 'zod';

const sendInput = z.object({ conversation_id: z.string().min(1), content: z.string().trim().min(1).max(2000) });

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHENTICATED', 'Sign in required.', 401);
  const searchParams = new URL(request.url).searchParams;
  const conversationId = searchParams.get('conversation');
  const taskId = searchParams.get('task');
  if (conversationId || taskId) {
    const conversation = await db.conversation.findFirst({ where: { ...(conversationId ? { id: conversationId } : { taskId: taskId! }), OR: [{ posterId: session.user.id }, { runnerId: session.user.id }] }, include: { task: { select: { title: true, runnerFee: true, status: true } }, messages: { orderBy: { createdAt: 'asc' } } } });
    if (!conversation) return apiError('FORBIDDEN', 'Conversation not found.', 404);
    await db.message.updateMany({ where: { conversationId: conversation.id, senderId: { not: session.user.id }, readAt: null }, data: { readAt: new Date() } });
    return Response.json({ conversation: { id: conversation.id, task_id: conversation.taskId, poster_id: conversation.posterId, runner_id: conversation.runnerId, task_title: conversation.task.title, runner_fee: Number(conversation.task.runnerFee), status: conversation.task.status }, messages: conversation.messages.map((message) => ({ id: message.id, sender_id: message.senderId, content: message.content, read_at: message.readAt?.toISOString() ?? null, created_at: message.createdAt.toISOString() })) });
  }
  const conversations = await db.conversation.findMany({ where: { OR: [{ posterId: session.user.id }, { runnerId: session.user.id }] }, include: { task: { select: { title: true } }, messages: { orderBy: { createdAt: 'desc' }, take: 1 } }, orderBy: { createdAt: 'desc' } });
  return Response.json({ conversations: conversations.map((item) => ({ id: item.id, task_id: item.taskId, task_title: item.task.title, poster_id: item.posterId, runner_id: item.runnerId, last_message: item.messages[0] ? { content: item.messages[0].content, created_at: item.messages[0].createdAt.toISOString() } : null })) });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHENTICATED', 'Sign in required.', 401);
  const parsed = sendInput.safeParse(await request.json());
  if (!parsed.success) return apiError('VALIDATION_ERROR', 'A message is required.', 400);
  const conversation = await db.conversation.findFirst({ where: { id: parsed.data.conversation_id, OR: [{ posterId: session.user.id }, { runnerId: session.user.id }] } });
  if (!conversation) return apiError('FORBIDDEN', 'Conversation not found.', 404);
  const message = await db.message.create({ data: { conversationId: conversation.id, senderId: session.user.id, content: parsed.data.content } });
  return Response.json({ message: { id: message.id, sender_id: message.senderId, content: message.content, created_at: message.createdAt.toISOString() } }, { status: 201 });
}
