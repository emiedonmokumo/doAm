import { randomInt } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { Prisma, type TaskStatus } from '@prisma/client';
import { db } from '@/lib/db';
import { createTaskSchema } from '@/lib/validation/tasks';
import { isWithinRunnerRadar } from '@/lib/repositories/location';
import { canAdvanceTask, taskHandoverStatus, taskRatingRecipient, taskRequiresProof } from '@/lib/services/task-policy';
import { encryptPin } from '@/lib/services/crypto';

export async function createTask(posterId: string, raw: unknown, images?: Array<{ url: string; publicId: string; order: number }>) {
  const input = createTaskSchema.parse(raw);
  const pin = String(randomInt(0, 10_000)).padStart(4, '0');
  const handshakePinHash = await bcrypt.hash(pin, 12);
  const handshakePinEncrypted = encryptPin(pin);
  const task = await db.$transaction(async (tx) => {
    const created = await tx.task.create({ data: {
      posterId, title: input.title, description: input.description, category: input.category,
      runnerFee: new Prisma.Decimal(input.runnerFee), estimatedExpenses: new Prisma.Decimal(input.estimatedExpenses),
      settlementMethod: input.settlementMethod,
      pickupLatitude: new Prisma.Decimal(input.pickup.latitude), pickupLongitude: new Prisma.Decimal(input.pickup.longitude),
      pickupCity: input.pickup.city, pickupRegion: input.pickup.region, pickupApproximateArea: input.pickup.approximateArea,
      ...(input.dropoff ? { dropoffLatitude: new Prisma.Decimal(input.dropoff.latitude), dropoffLongitude: new Prisma.Decimal(input.dropoff.longitude), dropoffCity: input.dropoff.city, dropoffRegion: input.dropoff.region, dropoffApproximateArea: input.dropoff.approximateArea } : {}),
      handshakePinHash,
      handshakePinEncrypted,
      ...(images?.length ? {
        images: {
          create: images.map((img) => ({
            url: img.url,
            publicId: img.publicId,
            order: img.order,
          })),
        },
      } : {}),
    }, include: { images: true } });
    await tx.taskEvent.create({ data: { taskId: created.id, actorId: posterId, type: 'POSTED' } });
    await tx.profile.update({ where: { id: posterId }, data: { createdCount: { increment: 1 } } });
    return created;
  });
  return { task, handshakePin: pin };
}

export async function claimTask(runnerId: string, taskId: string) {
  if (!(await isWithinRunnerRadar(runnerId, taskId))) throw new Error('This task is outside your 10 km radar.');
  return db.$transaction(async (tx) => {
    const task = await tx.task.findUniqueOrThrow({ where: { id: taskId } });
    if (task.posterId === runnerId) throw new Error('You cannot claim your own task.');
    if (task.status !== 'POSTED') throw new Error('This task has already been claimed.');
    const result = await tx.task.updateMany({ where: { id: taskId, status: 'POSTED', runnerId: null }, data: { runnerId, status: 'CLAIMED', claimedAt: new Date() } });
    if (!result.count) throw new Error('This task has already been claimed.');
    await tx.taskEvent.create({ data: { taskId, actorId: runnerId, type: 'CLAIMED' } });
    await tx.conversation.create({ data: { taskId, posterId: task.posterId, runnerId } });
    await tx.notification.create({ data: { recipientId: task.posterId, type: 'TASK_CLAIMED', title: 'Your task was claimed', entityId: taskId } });
    return { status: 'CLAIMED' as const };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function advanceTask(runnerId: string, taskId: string, next: TaskStatus) {
  return db.$transaction(async (tx) => {
    const task = await tx.task.findUniqueOrThrow({ where: { id: taskId } });
    if (task.runnerId !== runnerId) throw new Error('Only the assigned runner can update this task.');
    if (!canAdvanceTask(task.status, next)) throw new Error('This task cannot move to that step.');
    if (next === 'PROOF_SUBMITTED' && !taskRequiresProof(task.category)) throw new Error('Proof is not required for this task.');
    if (next === 'EN_ROUTE_DROPOFF' && !task.dropoffLatitude) throw new Error('This task has no drop-off location.');
    const updated = await tx.task.updateMany({ where: { id: taskId, runnerId, status: task.status }, data: { status: next } });
    if (!updated.count) throw new Error('The task has changed. Refresh and try again.');
    await tx.taskEvent.create({ data: { taskId, actorId: runnerId, type: next } });
    return { status: next };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function assertTaskProofEligible(runnerId: string, taskId: string) {
  const task = await db.task.findUnique({ where: { id: taskId }, select: { runnerId: true, status: true, category: true } });
  if (!task || task.runnerId !== runnerId) throw new Error('Only the assigned runner can submit proof.');
  if (task.status !== 'ARRIVED_PICKUP' || !taskRequiresProof(task.category)) throw new Error('Proof cannot be submitted at this step.');
}

export async function submitTaskProof(runnerId: string, taskId: string, proof: { url: string; publicId: string }) {
  return db.$transaction(async (tx) => {
    const task = await tx.task.findUniqueOrThrow({ where: { id: taskId } });
    if (task.runnerId !== runnerId) throw new Error('Only the assigned runner can submit proof.');
    if (task.status !== 'ARRIVED_PICKUP' || !taskRequiresProof(task.category)) throw new Error('Proof cannot be submitted at this step.');
    await tx.task.update({ where: { id: taskId }, data: { proofUrl: proof.url, proofPublicId: proof.publicId, status: 'PROOF_SUBMITTED' } });
    await tx.taskEvent.create({ data: { taskId, actorId: runnerId, type: 'PROOF_SUBMITTED' } });
    return { status: 'PROOF_SUBMITTED' as const };
  });
}

export async function settleTask(runnerId: string, taskId: string, pin: string) {
  const result = await db.$transaction(async (tx) => {
    const task = await tx.task.findUniqueOrThrow({ where: { id: taskId } });
    if (task.runnerId !== runnerId) throw new Error('Only the assigned runner can complete this task.');
    const finishStatus = taskHandoverStatus(Boolean(task.dropoffLatitude), Boolean(task.proofUrl));
    if (task.status !== finishStatus) throw new Error('Reach the handover point before completing the task.');
    if (taskRequiresProof(task.category) && !task.proofUrl) throw new Error('Submit the required proof before handover.');
    if (task.pinLockedAt || task.pinFailedAttempts >= 5) throw new Error('PIN verification is temporarily locked.');
    const matches = await bcrypt.compare(pin, task.handshakePinHash);
    if (!matches) {
      const updated = await tx.task.updateMany({ where: { id: taskId, pinFailedAttempts: { lt: 5 }, pinLockedAt: null }, data: { pinFailedAttempts: { increment: 1 }, ...(task.pinFailedAttempts === 4 ? { pinLockedAt: new Date() } : {}) } });
      return updated.count ? { status: 'INVALID_PIN' as const } : { status: 'LOCKED' as const };
    }
    await tx.task.update({ where: { id: taskId }, data: { status: 'COMPLETED', completedAt: new Date() } });
    await tx.taskEvent.create({ data: { taskId, actorId: runnerId, type: 'COMPLETED', metadata: { settlementMethod: task.settlementMethod } } });
    await tx.profile.updateMany({ where: { id: { in: [task.posterId, runnerId] } }, data: { completedCount: { increment: 1 } } });
    await tx.notification.create({ data: { recipientId: task.posterId, type: 'TASK_COMPLETED', title: 'Your task is complete', entityId: taskId } });
    return { status: 'COMPLETED' as const };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  if (result.status === 'INVALID_PIN') throw new Error('The PIN is incorrect.');
  if (result.status === 'LOCKED') throw new Error('PIN verification is temporarily locked.');
  return result;
}

export async function rateTask(raterId: string, taskId: string, score: number, review?: string) {
  return db.$transaction(async (tx) => {
    const task = await tx.task.findUniqueOrThrow({ where: { id: taskId } });
    const ratedUserId = taskRatingRecipient(task, raterId);
    if (!ratedUserId) throw new Error('Only the poster and assigned runner can rate a completed task.');
    const rating = await tx.taskRating.upsert({
      where: { taskId_raterId_ratedUserId: { taskId, raterId, ratedUserId } },
      create: { taskId, raterId, ratedUserId, score, review },
      update: { score, review },
    });
    const aggregate = await tx.taskRating.aggregate({ where: { ratedUserId }, _avg: { score: true }, _count: { score: true } });
    await tx.profile.update({
      where: { id: ratedUserId },
      data: { ratingAverage: new Prisma.Decimal(aggregate._avg.score ?? 0), ratingCount: aggregate._count.score },
    });
    await tx.notification.create({ data: { recipientId: ratedUserId, type: 'TASK_RATED', title: 'You received a task review', entityId: taskId } });
    return rating;
  });
}

export async function generateTaskPin(posterId: string, taskId: string) {
  const task = await db.task.findUniqueOrThrow({ where: { id: taskId } });
  if (task.posterId !== posterId) {
    throw new Error('Only the task poster can generate a handover PIN.');
  }
  if (task.status === 'COMPLETED' || task.status === 'CANCELLED') {
    throw new Error('Cannot generate a handover PIN for a completed or cancelled task.');
  }

  const pin = String(randomInt(0, 10_000)).padStart(4, '0');
  const handshakePinHash = await bcrypt.hash(pin, 12);
  const handshakePinEncrypted = encryptPin(pin);

  await db.task.update({
    where: { id: taskId },
    data: {
      handshakePinHash,
      handshakePinEncrypted,
      pinFailedAttempts: 0,
      pinLockedAt: null,
    },
  });

  return { handshakePin: pin };
}