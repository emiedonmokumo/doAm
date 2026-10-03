import { db } from '@/lib/db';

const RADAR_RADIUS_KM = 10;
const radians = (degrees: number) => (degrees * Math.PI) / 180;

export function distanceKm(from: { latitude: number; longitude: number }, to: { latitude: number; longitude: number }) {
  const dLat = radians(to.latitude - from.latitude);
  const dLon = radians(to.longitude - from.longitude);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(from.latitude)) * Math.cos(radians(to.latitude)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Uses only a signed-in runner's saved location; precise coordinates stay server-side. */
export async function findTasksNearRunner(runnerId: string) {
  const location = await db.location.findUnique({ where: { profileId: runnerId } });
  if (!location) return null;
  const latitude = Number(location.latitude);
  const longitude = Number(location.longitude);
  const latitudePadding = RADAR_RADIUS_KM / 110.574;
  const longitudePadding = RADAR_RADIUS_KM / (111.32 * Math.max(Math.cos(radians(latitude)), 0.01));
  const candidates = await db.task.findMany({
    where: {
      status: 'POSTED', posterId: { not: runnerId },
      pickupLatitude: { gte: latitude - latitudePadding, lte: latitude + latitudePadding },
      pickupLongitude: { gte: longitude - longitudePadding, lte: longitude + longitudePadding },
    },
    orderBy: { createdAt: 'desc' }, take: 200,
  });
  return candidates.flatMap((task) => {
    const km = distanceKm({ latitude, longitude }, { latitude: Number(task.pickupLatitude), longitude: Number(task.pickupLongitude) });
    if (km > RADAR_RADIUS_KM) return [];
    return [{ id: task.id, title: task.title, description: task.description, category: task.category, runnerFee: Number(task.runnerFee), estimatedExpenses: Number(task.estimatedExpenses), settlementMethod: task.settlementMethod, pickupArea: task.pickupApproximateArea, pickupCity: task.pickupCity, pickupRegion: task.pickupRegion, distanceKm: Math.round(km * 10) / 10, createdAt: task.createdAt }];
  });
}

export async function isWithinRunnerRadar(runnerId: string, taskId: string) {
  const [location, task] = await Promise.all([
    db.location.findUnique({ where: { profileId: runnerId } }),
    db.task.findUnique({ where: { id: taskId }, select: { pickupLatitude: true, pickupLongitude: true } }),
  ]);
  if (!location || !task) return false;
  return distanceKm(
    { latitude: Number(location.latitude), longitude: Number(location.longitude) },
    { latitude: Number(task.pickupLatitude), longitude: Number(task.pickupLongitude) },
  ) <= RADAR_RADIUS_KM;
}