import { auth } from '@/auth';
import { db } from '@/lib/db';
export async function GET() { const session=await auth(); if (!session?.user?.id) return Response.json({count:0}); const count=await db.notification.count({where:{recipientId:session.user.id,readAt:null}}); return Response.json({count}); }
