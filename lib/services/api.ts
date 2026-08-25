import { Prisma } from '@prisma/client';

export function decimal(value: Prisma.Decimal | number | null | undefined) {
  return value == null ? null : Number(value);
}

export function publicDoAm(doam: {
  id: string; creatorId: string; title: string; description: string | null; reward: Prisma.Decimal;
  category: string | null; status: string; scheduledAt: Date | null; recurrence: string | null;
  isMultiPerson: boolean;
  createdAt: Date; location: { latitude: Prisma.Decimal; longitude: Prisma.Decimal; city: string; region: string; approximateAddress: string | null } | null;
  creator: { id: string; profile: { fullName: string; username: string; avatarUrl: string | null; ratingAverage: Prisma.Decimal; ratingCount: number } | null };
  _count?: { likes: number; comments: number; applications?: number };
}) {
  const location = doam.location;
  return {
    id: doam.id,
    creator_id: doam.creatorId,
    title: doam.title,
    description: doam.description,
    reward: decimal(doam.reward) ?? 0,
    category: doam.category,
    status: doam.status,
    is_multi_person: doam.isMultiPerson,
    scheduled_date: doam.scheduledAt?.toISOString() ?? null,
    scheduled_time: doam.scheduledAt ? doam.scheduledAt.toISOString().slice(11, 16) : null,
    recurring: doam.recurrence,
    location_label: location?.approximateAddress ?? (location ? `${location.city}, ${location.region}` : null),
    // Public locations are deliberately rounded to an area, never exact coordinates.
    latitude: location ? Math.round(decimal(location.latitude)! * 100) / 100 : null,
    longitude: location ? Math.round(decimal(location.longitude)! * 100) / 100 : null,
    created_at: doam.createdAt.toISOString(),
    creator: doam.creator.profile ? {
      id: doam.creator.id,
      full_name: doam.creator.profile.fullName,
      username: doam.creator.profile.username,
      avatar_url: doam.creator.profile.avatarUrl,
      rating_avg: decimal(doam.creator.profile.ratingAverage) ?? 0,
      rating_count: doam.creator.profile.ratingCount,
    } : undefined,
    like_count: doam._count?.likes ?? 0,
    comment_count: doam._count?.comments ?? 0,
    interest_count: doam._count?.applications ?? 0,
  };
}

export function apiError(code: string, message: string, status: number) {
  return Response.json({ error: { code, message } }, { status });
}
