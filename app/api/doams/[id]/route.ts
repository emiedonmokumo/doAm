import { auth } from '@/auth';
import { db } from '@/lib/db';
import { apiError, publicDoAm } from '@/lib/services/api';

function distanceKm(latitudeA: number, longitudeA: number, latitudeB: number, longitudeB: number) {
  const radius = 6371;
  const deltaLatitude = (latitudeB - latitudeA) * Math.PI / 180;
  const deltaLongitude = (longitudeB - longitudeA) * Math.PI / 180;
  const value = Math.sin(deltaLatitude / 2) ** 2 + Math.cos(latitudeA * Math.PI / 180) * Math.cos(latitudeB * Math.PI / 180) * Math.sin(deltaLongitude / 2) ** 2;
  return Math.round(radius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value)) * 10) / 10;
}

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const session = await auth();
  const doam = await db.doAm.findUnique({
    where: { id },
    include: {
      creator: { include: { profile: true } }, location: true,
      applications: { include: { applicant: { include: { profile: { include: { location: true } } } } } }, statusHistory: { orderBy: { createdAt: 'desc' } },
      comments: { orderBy: { createdAt: 'asc' } }, ratings: true,
      _count: { select: { likes: true, comments: true } },
    },
  });
  if (!doam) return apiError('NOT_FOUND', 'This DoAm no longer exists.', 404);
  const viewerId = session?.user?.id;
  const [liked, saved] = viewerId ? await Promise.all([
    db.like.findUnique({ where: { doamId_userId: { doamId: id, userId: viewerId } } }),
    db.savedDoAm.findUnique({ where: { doamId_userId: { doamId: id, userId: viewerId } } }),
  ]) : [null, null];
  const selected = doam.applications.filter((item) => item.status === 'ACCEPTED');
  const interested = doam.applications.filter((item) => item.status === 'INTERESTED');
  // An offer to help gives the requester enough context to make a selection, but
  // never exposes the applicant's phone number, street address, or exact location.
  const candidateFeedback = viewerId === doam.creatorId && interested.length
    ? await db.rating.findMany({
      where: { ratedUserId: { in: interested.map((item) => item.applicantId) }, review: { not: null } },
      select: { ratedUserId: true, score: true, review: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 30,
    })
    : [];
  const feedbackByApplicantId = new Map<string, { score: number; review: string; created_at: string }[]>();
  for (const feedback of candidateFeedback) {
    if (!feedback.review) continue;
    const entries = feedbackByApplicantId.get(feedback.ratedUserId) ?? [];
    if (entries.length < 3) entries.push({ score: feedback.score, review: feedback.review, created_at: feedback.createdAt.toISOString() });
    feedbackByApplicantId.set(feedback.ratedUserId, entries);
  }
  const conversations = viewerId && (viewerId === doam.creatorId || selected.some((item) => item.applicantId === viewerId)) ? await db.conversation.findMany({ where: { doamId: id, OR: [{ requesterId: viewerId }, { doerId: viewerId }] } }) : [];
  const candidate = (application: typeof doam.applications[number]) => {
    const profile = application.applicant.profile;
    const candidateLocation = profile?.location;
    const doamLocation = doam.location;
    return {
      id: application.id,
      user_id: application.applicantId,
      full_name: profile?.fullName ?? 'DoAm member',
      username: profile?.username ?? 'member',
      avatar_url: profile?.avatarUrl ?? null,
      rating_avg: Number(profile?.ratingAverage ?? 0),
      rating_count: profile?.ratingCount ?? 0,
      completed_count: profile?.completedCount ?? 0,
      distance_km: candidateLocation && doamLocation ? distanceKm(Number(candidateLocation.latitude), Number(candidateLocation.longitude), Number(doamLocation.latitude), Number(doamLocation.longitude)) : null,
      ...(viewerId === doam.creatorId ? {
        profile: {
          bio: profile?.bio ?? null,
          skills: profile?.skills ?? [],
          availability: profile?.availability ?? null,
          area: candidateLocation ? candidateLocation.approximateAddress ?? `${candidateLocation.city}, ${candidateLocation.region}` : null,
          recent_reviews: feedbackByApplicantId.get(application.applicantId) ?? [],
        },
      } : {}),
    };
  };
  return Response.json({
    doam: publicDoAm(doam),
    viewer: viewerId ? {
      liked: Boolean(liked), saved: Boolean(saved),
      application: doam.applications.find((item) => item.applicantId === viewerId)?.status ?? null,
      is_creator: doam.creatorId === viewerId,
    } : null,
    interest_count: interested.length,
    interested_people: viewerId === doam.creatorId ? interested.map(candidate) : [],
    selected_helpers: selected.map(candidate),
    conversations: conversations.map((item) => ({ id: item.id, doer_id: item.doerId })),
    comments: doam.comments.map((comment) => ({ id: comment.id, user_id: comment.userId, content: comment.content, created_at: comment.createdAt.toISOString() })),
    history: doam.statusHistory.map((item) => ({ id: item.id, status: item.status, changed_by_id: item.changedById, created_at: item.createdAt.toISOString() })),
    ratings: doam.ratings.map((item) => ({ id: item.id, score: item.score, review: item.review, rater_id: item.raterId, rated_user_id: item.ratedUserId })),
  });
}
