import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/lib/db';

const schema = z.object({ fullName: z.string().trim().min(2).max(80), username: z.string().trim().toLowerCase().regex(/^[a-z0-9_]{3,30}$/), email: z.string().email(), password: z.string().min(8).max(128) });

export async function POST(request: Request) {
  const input = schema.safeParse(await request.json());
  if (!input.success) return Response.json({ error: { message: 'Please check your registration details.' } }, { status: 400 });
  const email = input.data.email.toLowerCase();
  const exists = await db.user.findFirst({ where: { OR: [{ email }, { profile: { is: { username: input.data.username } } }] } });
  if (exists) return Response.json({ error: { message: 'Email or username is already in use.' } }, { status: 409 });
  const user = await db.user.create({ data: { email, name: input.data.fullName, passwordHash: await bcrypt.hash(input.data.password, 12), profile: { create: { username: input.data.username, fullName: input.data.fullName } } } });
  return Response.json({ id: user.id }, { status: 201 });
}
