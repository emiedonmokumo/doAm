import { auth } from '@/auth';
import { db } from '@/lib/db';
import { apiError } from '@/lib/services/api';
import { z } from 'zod';

const profileInput = z.object({
  full_name: z.string().trim().min(1).max(100).optional(),
  bio: z.string().trim().max(500).nullable().optional(),
  phone: z.string().trim().max(30).nullable().optional(),
  avatar_url: z.string().url().nullable().optional(),
  skills: z.array(z.string().trim().min(1).max(50)).max(20).optional(),
  availability: z.string().trim().max(100).nullable().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json(null, { status: 401 });
  const profile = await db.profile.findUnique({ where: { id: session.user.id }, include: { location: { select: { id: true } } } });
  if (!profile) return Response.json(null, { status: 404 });
  return Response.json({ id: profile.id, full_name: profile.fullName, username: profile.username, email: session.user.email ?? '', bio: profile.bio, avatar_url: profile.avatarUrl, phone: profile.phone, skills: profile.skills, availability: profile.availability, rating_avg: Number(profile.ratingAverage), rating_count: profile.ratingCount, doams_created_count: profile.createdCount, doams_completed_count: profile.completedCount, location_set: Boolean(profile.location) });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHENTICATED', 'Sign in required.', 401);
  const parsed = profileInput.safeParse(await request.json());
  if (!parsed.success) return apiError('VALIDATION_ERROR', 'Profile information is invalid.', 400);
  const profile = await db.profile.update({ where: { id: session.user.id }, data: {
    ...(parsed.data.full_name !== undefined ? { fullName: parsed.data.full_name } : {}),
    ...(parsed.data.bio !== undefined ? { bio: parsed.data.bio } : {}),
    ...(parsed.data.phone !== undefined ? { phone: parsed.data.phone } : {}),
    ...(parsed.data.avatar_url !== undefined ? { avatarUrl: parsed.data.avatar_url } : {}),
    ...(parsed.data.skills !== undefined ? { skills: parsed.data.skills } : {}),
    ...(parsed.data.availability !== undefined ? { availability: parsed.data.availability } : {}),
  } });
  return Response.json({ id: profile.id, full_name: profile.fullName, username: profile.username, bio: profile.bio, avatar_url: profile.avatarUrl, phone: profile.phone, skills: profile.skills, availability: profile.availability });
}
