import { auth } from '@/auth';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

const schema = z.object({ bio:z.string().max(500).optional(), phone:z.string().max(30).optional(), skills:z.array(z.string().max(50)).max(20).optional(), availability:z.string().max(120).optional(), latitude:z.number(), longitude:z.number(), city:z.string().min(2), region:z.string().min(2), approximateAddress:z.string().max(160).optional() });
export async function PUT(request: Request) {
  const session=await auth(); if (!session?.user?.id) return Response.json({error:{message:'Sign in required.'}},{status:401});
  const parsed=schema.safeParse(await request.json()); if (!parsed.success) return Response.json({error:{message:'Invalid onboarding details.'}},{status:400});
  const input=parsed.data;
  await db.profile.update({ where:{id:session.user.id}, data:{bio:input.bio||null,phone:input.phone||null,skills:input.skills||[],availability:input.availability||null,location:{upsert:{create:{latitude:new Prisma.Decimal(input.latitude),longitude:new Prisma.Decimal(input.longitude),city:input.city,region:input.region,approximateAddress:input.approximateAddress},update:{latitude:new Prisma.Decimal(input.latitude),longitude:new Prisma.Decimal(input.longitude),city:input.city,region:input.region,approximateAddress:input.approximateAddress}}}}});
  return Response.json({ok:true});
}
