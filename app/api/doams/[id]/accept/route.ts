import { auth } from '@/auth';
import { acceptDoAm } from '@/lib/services/doams';
export async function POST(_: Request, { params }: { params: Promise<{ id:string }> }) { const session=await auth(); if (!session?.user?.id) return Response.json({error:{message:'Sign in required.'}},{status:401}); try { return Response.json(await acceptDoAm(session.user.id,(await params).id)); } catch(error) { return Response.json({error:{message:error instanceof Error ? error.message:'Unable to accept.'}},{status:409}); } }
