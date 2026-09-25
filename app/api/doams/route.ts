import { auth } from '@/auth';
import { db } from '@/lib/db';
import { publicDoAm } from '@/lib/services/api';
import { createDoAm } from '@/lib/services/doams';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const search = url.searchParams.get('search')?.trim();
  const category = url.searchParams.get('category');
  const sort =
    url.searchParams.get('sort') === 'reward'
      ? 'reward'
      : url.searchParams.get('sort') === 'popular'
        ? 'popular'
        : 'recent';
  const cursor = url.searchParams.get('cursor');
  const take = Math.min(Math.max(Number(url.searchParams.get('take') ?? 30), 1), 50);
  const doams = await db.doAm.findMany({
    where: {
      status: { in: ['PUBLISHED', 'ACCEPTED', 'IN_PROGRESS'] },
      ...(category && category !== 'All' ? { category } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    include: {
      creator: { include: { profile: true } },
      location: true,
      _count: {
        select: { likes: true, comments: true, applications: { where: { status: 'INTERESTED' } } },
      },
    },
    orderBy:
      sort === 'reward'
        ? { reward: 'desc' }
        : sort === 'popular'
          ? { likes: { _count: 'desc' } }
          : { createdAt: 'desc' },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  const next = doams.length > take ? (doams.pop()?.id ?? null) : null;
  return Response.json({ doams: doams.map(publicDoAm), next_cursor: next });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return Response.json(
      { error: { code: 'UNAUTHENTICATED', message: 'Sign in required.' } },
      { status: 401 },
    );
  try {
    return Response.json(await createDoAm(session.user.id, await request.json()), { status: 201 });
  } catch (error) {
    return Response.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: error instanceof Error ? error.message : 'Invalid request.',
        },
      },
      { status: 400 },
    );
  }
}
