export type ProfileCompletion = { location_set: boolean };

/** A DoAm account is ready for the app only after its private location is set. */
export function isProfileComplete(profile: ProfileCompletion | null) {
  return Boolean(profile?.location_set);
}
