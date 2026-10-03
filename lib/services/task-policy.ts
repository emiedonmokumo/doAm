import type { TaskStatus } from '@prisma/client';

const transitions: Partial<Record<TaskStatus, TaskStatus[]>> = {
  CLAIMED: ['EN_ROUTE_PICKUP'], EN_ROUTE_PICKUP: ['ARRIVED_PICKUP'],
  ARRIVED_PICKUP: ['PROOF_SUBMITTED', 'EN_ROUTE_DROPOFF', 'ARRIVED_DROPOFF'],
  PROOF_SUBMITTED: ['EN_ROUTE_DROPOFF', 'ARRIVED_DROPOFF'], EN_ROUTE_DROPOFF: ['ARRIVED_DROPOFF'],
};

export function canAdvanceTask(from: TaskStatus, to: TaskStatus) {
  return transitions[from]?.includes(to) ?? false;
}

export function taskRequiresProof(category: string) {
  return category === 'PICKUP_DELIVERY' || category === 'QUICK_REPAIR';
}

export function taskHandoverStatus(hasDropoff: boolean, hasProof: boolean): TaskStatus {
  if (hasDropoff) return 'ARRIVED_DROPOFF';
  if (hasProof) return 'PROOF_SUBMITTED';
  return 'ARRIVED_PICKUP';
}

export function taskRatingRecipient(task: { status: string; posterId: string; runnerId: string | null }, raterId: string) {
  if (task.status !== 'COMPLETED' || !task.runnerId) return null;
  if (raterId === task.posterId) return task.runnerId;
  if (raterId === task.runnerId) return task.posterId;
  return null;
}