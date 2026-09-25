import { ApplicationStatus, DoAmStatus, Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { createDoAmSchema } from '@/lib/validation/doam';

const transitions: Record<DoAmStatus, DoAmStatus[]> = {
  DRAFT: ['PUBLISHED'],
  PUBLISHED: ['ACCEPTED', 'CANCELLED', 'EXPIRED'],
  ACCEPTED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
  EXPIRED: [],
};
export function canTransition(from: DoAmStatus, to: DoAmStatus) {
  return transitions[from].includes(to);
}

export async function createDoAm(userId: string, raw: unknown) {
  const input = createDoAmSchema.parse(raw);
  return db.$transaction(async (tx) => {
    const doam = await tx.doAm.create({
      data: {
        creatorId: userId,
        title: input.title,
        description: input.description,
        reward: new Prisma.Decimal(input.reward),
        category: input.category,
        status: input.status,
        isMultiPerson: input.isMultiPerson ?? false,
        maxParticipants: input.maxParticipants ?? 1,
        scheduledAt: input.scheduledAt,
        recurrence: input.recurrence,
        instructions: input.instructions,
        location: {
          create: {
            latitude: new Prisma.Decimal(input.latitude),
            longitude: new Prisma.Decimal(input.longitude),
            city: input.city,
            region: input.region,
            approximateAddress: input.approximateAddress,
          },
        },
      },
    });
    await Promise.all([
      tx.doAmStatusHistory.create({
        data: { doamId: doam.id, changedById: userId, status: doam.status },
      }),
      tx.profile.update({ where: { id: userId }, data: { createdCount: { increment: 1 } } }),
    ]);
    return doam;
  });
}

export function selectedCount(applications: { status: ApplicationStatus }[]) {
  return applications.filter((item) => item.status === 'ACCEPTED').length;
}
export function isOpenForInterest(doam: { status: DoAmStatus; isMultiPerson: boolean }) {
  return doam.status === 'PUBLISHED' || (doam.isMultiPerson && doam.status === 'ACCEPTED');
}
export function hasSelectionCapacity(
  applications: { status: ApplicationStatus }[],
  maxParticipants: number,
) {
  return selectedCount(applications) < maxParticipants;
}

export async function expressInterest(userId: string, doamId: string) {
  return db.$transaction(
    async (tx) => {
      const doam = await tx.doAm.findUniqueOrThrow({
        where: { id: doamId },
        include: { applications: true },
      });
      if (doam.creatorId === userId) throw new Error('You cannot offer help on your own DoAm.');
      if (!isOpenForInterest(doam)) throw new Error('This DoAm is no longer open for helpers.');
      const existing = doam.applications.find((item) => item.applicantId === userId);
      if (existing?.status === 'ACCEPTED')
        throw new Error('You have already been selected for this DoAm.');
      if (existing?.status === 'INTERESTED')
        throw new Error('You have already said you can do this.');
      await tx.doAmApplication.upsert({
        where: { doamId_applicantId: { doamId, applicantId: userId } },
        create: { doamId, applicantId: userId, status: 'INTERESTED' },
        update: { status: 'INTERESTED' },
      });
      await tx.notification.create({
        data: {
          recipientId: doam.creatorId,
          type: 'INTEREST',
          title: 'Someone can do this',
          body: 'Review people who offered to help with your DoAm.',
          entityId: doamId,
        },
      });
      return { status: 'INTERESTED' as const };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

export async function withdrawInterest(userId: string, doamId: string) {
  const application = await db.doAmApplication.updateMany({
    where: { doamId, applicantId: userId, status: 'INTERESTED' },
    data: { status: 'WITHDRAWN' },
  });
  if (!application.count) throw new Error('There is no active offer to withdraw.');
  return { status: 'WITHDRAWN' as const };
}

export async function selectHelper(requesterId: string, doamId: string, applicationId: string) {
  return db.$transaction(
    async (tx) => {
      const doam = await tx.doAm.findUniqueOrThrow({
        where: { id: doamId },
        include: { applications: true },
      });
      if (doam.creatorId !== requesterId)
        throw new Error('Only the requester can choose a helper.');
      if (!isOpenForInterest(doam)) throw new Error('This DoAm is no longer accepting helpers.');
      if (!hasSelectionCapacity(doam.applications, doam.maxParticipants))
        throw new Error('The helper capacity has already been reached.');
      const application = doam.applications.find((item) => item.id === applicationId);
      if (!application || application.status !== 'INTERESTED')
        throw new Error('This person is no longer available to select.');
      await tx.doAmApplication.update({
        where: { id: application.id },
        data: { status: 'ACCEPTED' },
      });
      if (doam.status === 'PUBLISHED') {
        await tx.doAm.update({ where: { id: doamId }, data: { status: 'ACCEPTED' } });
        await tx.doAmStatusHistory.create({
          data: { doamId, changedById: requesterId, status: 'ACCEPTED' },
        });
      }
      const conversation = await tx.conversation.upsert({
        where: {
          doamId_requesterId_doerId: { doamId, requesterId, doerId: application.applicantId },
        },
        create: { doamId, requesterId, doerId: application.applicantId },
        update: {},
      });
      await Promise.all([
        tx.notification.create({
          data: {
            recipientId: application.applicantId,
            type: 'MATCHED',
            title: 'You were chosen to help',
            body: 'Open your DoAm room to coordinate with the requester.',
            entityId: doamId,
          },
        }),
        tx.notification.create({
          data: {
            recipientId: requesterId,
            type: 'MATCHED',
            title: 'Helper selected',
            body: 'Your DoAm room is ready to coordinate the work.',
            entityId: doamId,
          },
        }),
      ]);
      return { status: 'ACCEPTED' as const, conversationId: conversation.id };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

export const acceptDoAm = expressInterest;

export async function changeStatus(userId: string, doamId: string, next: DoAmStatus) {
  return db.$transaction(async (tx) => {
    const doam = await tx.doAm.findUniqueOrThrow({
      where: { id: doamId },
      include: { applications: true },
    });
    const selected = doam.applications.filter((item) => item.status === 'ACCEPTED');
    const isSelectedHelper = selected.some((item) => item.applicantId === userId);
    if (userId !== doam.creatorId && !isSelectedHelper)
      throw new Error('Only the requester or a selected helper can change this DoAm.');
    if (!canTransition(doam.status, next)) throw new Error('Invalid status transition.');
    if (next === 'IN_PROGRESS' && !selected.length)
      throw new Error('Choose a helper before starting this DoAm.');
    const result = await tx.doAm.update({ where: { id: doamId }, data: { status: next } });
    await tx.doAmStatusHistory.create({ data: { doamId, changedById: userId, status: next } });
    if (next === 'COMPLETED')
      await tx.profile.updateMany({
        where: { id: { in: [doam.creatorId, ...selected.map((item) => item.applicantId)] } },
        data: { completedCount: { increment: 1 } },
      });
    const recipients = [doam.creatorId, ...selected.map((item) => item.applicantId)].filter(
      (id) => id !== userId,
    );
    if (recipients.length)
      await tx.notification.createMany({
        data: recipients.map((recipientId) => ({
          recipientId,
          type: 'STATUS_CHANGE',
          title: `DoAm ${next === 'IN_PROGRESS' ? 'started' : next.toLowerCase()}`,
          entityId: doamId,
        })),
      });
    return result;
  });
}

export async function submitRating(
  raterId: string,
  doamId: string,
  ratedUserId: string,
  score: number,
  review?: string,
) {
  return db.$transaction(async (tx) => {
    const doam = await tx.doAm.findUniqueOrThrow({
      where: { id: doamId },
      include: { applications: true },
    });
    if (doam.status !== 'COMPLETED') throw new Error('Ratings are available after completion.');
    const selectedIds = doam.applications
      .filter((item) => item.status === 'ACCEPTED')
      .map((item) => item.applicantId);
    const valid =
      raterId === doam.creatorId
        ? selectedIds.includes(ratedUserId)
        : selectedIds.includes(raterId) && ratedUserId === doam.creatorId;
    if (!valid) throw new Error('Only completed DoAm participants can review one another.');
    const rating = await tx.rating.upsert({
      where: { doamId_raterId_ratedUserId: { doamId, raterId, ratedUserId } },
      create: { doamId, raterId, ratedUserId, score, review },
      update: { score, review },
    });
    const aggregate = await tx.rating.aggregate({
      where: { ratedUserId },
      _avg: { score: true },
      _count: { score: true },
    });
    await tx.profile.update({
      where: { id: ratedUserId },
      data: {
        ratingAverage: new Prisma.Decimal(aggregate._avg.score ?? 0),
        ratingCount: aggregate._count.score,
      },
    });
    await tx.notification.create({
      data: {
        recipientId: ratedUserId,
        type: 'RATING',
        title: 'You received a new review',
        entityId: doamId,
      },
    });
    return rating;
  });
}
