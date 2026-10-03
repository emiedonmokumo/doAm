import { db } from '@/lib/db';

const RADAR_RADIUS_KM = 10;
const NEARBY_USERS_LIMIT = 50;
/** ~550 m grid; combined with a stable per-entity offset so points never reveal an exact address. */
const FUZZ_GRID_DEG = 0.005;
const FUZZ_OFFSET_DEG = 0.002;
const radians = (degrees: number) => (degrees * Math.PI) / 180;

function stableUnit(seed: string) {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 10_000) / 10_000;
}

/**
 * Deterministic fuzzing: snap to a coarse grid, then apply an offset derived from the entity id.
 * Deterministic (not random per request) so repeated requests cannot be averaged to recover the true point.
 */
export function approximateCoordinates(seed: string, latitude: number, longitude: number) {
  const snap = (value: number) => Math.round(value / FUZZ_GRID_DEG) * FUZZ_GRID_DEG;
  const offset = (salt: string) => (stableUnit(`${seed}:${salt}`) * 2 - 1) * FUZZ_OFFSET_DEG;
  return {
    latitude: Number((snap(latitude) + offset('lat')).toFixed(5)),
    longitude: Number((snap(longitude) + offset('lng')).toFixed(5)),
  };
}

function radarBounds(latitude: number, longitude: number) {
  const latitudePadding = RADAR_RADIUS_KM / 110.574;
  const longitudePadding = RADAR_RADIUS_KM / (111.32 * Math.max(Math.cos(radians(latitude)), 0.01));
  return {
    latitude: { gte: latitude - latitudePadding, lte: latitude + latitudePadding },
    longitude: { gte: longitude - longitudePadding, lte: longitude + longitudePadding },
  };
}

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
  const bounds = radarBounds(latitude, longitude);
  const candidates = await db.task.findMany({
    where: {
      status: 'POSTED', posterId: { not: runnerId },
      pickupLatitude: bounds.latitude,
      pickupLongitude: bounds.longitude,
    },
    orderBy: { createdAt: 'desc' }, take: 200,
  });
  return candidates.flatMap((task) => {
    const km = distanceKm({ latitude, longitude }, { latitude: Number(task.pickupLatitude), longitude: Number(task.pickupLongitude) });
    if (km > RADAR_RADIUS_KM) return [];
    const approximate = approximateCoordinates(task.id, Number(task.pickupLatitude), Number(task.pickupLongitude));
    return [{ id: task.id, title: task.title, description: task.description, category: task.category, runnerFee: Number(task.runnerFee), estimatedExpenses: Number(task.estimatedExpenses), settlementMethod: task.settlementMethod, pickupArea: task.pickupApproximateArea, pickupCity: task.pickupCity, pickupRegion: task.pickupRegion, approximateLatitude: approximate.latitude, approximateLongitude: approximate.longitude, distanceKm: Math.round(km * 10) / 10, createdAt: task.createdAt }];
  });
}

/** The signed-in runner's own saved point, used only to centre their own map. */
export async function getRunnerCenter(runnerId: string) {
  const location = await db.location.findUnique({ where: { profileId: runnerId }, select: { latitude: true, longitude: true, city: true, region: true } });
  if (!location) return null;
  return { latitude: Number(location.latitude), longitude: Number(location.longitude), city: location.city, region: location.region };
}

/** Nearby community presence. Returns only fuzzed points — no ids, names, or addresses. */
export async function findUsersNearRunner(runnerId: string) {
  const location = await db.location.findUnique({ where: { profileId: runnerId } });
  if (!location) return [];
  const latitude = Number(location.latitude);
  const longitude = Number(location.longitude);
  const bounds = radarBounds(latitude, longitude);
  const neighbours = await db.location.findMany({
    where: { profileId: { not: null, notIn: [runnerId] }, latitude: bounds.latitude, longitude: bounds.longitude },
    select: { profileId: true, latitude: true, longitude: true },
    orderBy: { createdAt: 'desc' }, take: NEARBY_USERS_LIMIT * 2,
  });
  return neighbours.flatMap((neighbour) => {
    const point = { latitude: Number(neighbour.latitude), longitude: Number(neighbour.longitude) };
    if (!neighbour.profileId || distanceKm({ latitude, longitude }, point) > RADAR_RADIUS_KM) return [];
    return [approximateCoordinates(neighbour.profileId, point.latitude, point.longitude)];
  }).slice(0, NEARBY_USERS_LIMIT);
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