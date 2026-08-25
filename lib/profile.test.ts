import { describe, expect, it } from 'vitest';
import { isProfileComplete } from './profile';

describe('profile completion', () => {
  it('requires a saved location, rather than optional profile fields', () => {
    expect(isProfileComplete({ location_set: false })).toBe(false);
    expect(isProfileComplete({ location_set: true })).toBe(true);
  });
});
