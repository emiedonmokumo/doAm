import { describe, expect, it } from 'vitest';
import { canTransition, hasSelectionCapacity, isOpenForInterest } from './doams';

describe('DoAm lifecycle transitions', () => {
  it('allows the published-to-accepted flow', () => {
    expect(canTransition('PUBLISHED', 'ACCEPTED')).toBe(true);
  });

  it('does not allow a completed DoAm to change state', () => {
    expect(canTransition('COMPLETED', 'IN_PROGRESS')).toBe(false);
    expect(canTransition('COMPLETED', 'CANCELLED')).toBe(false);
  });

  it('keeps a single-person DoAm open only before a helper is selected', () => {
    expect(isOpenForInterest({ status: 'PUBLISHED', isMultiPerson: false })).toBe(true);
    expect(isOpenForInterest({ status: 'ACCEPTED', isMultiPerson: false })).toBe(false);
  });

  it('keeps a multi-person DoAm open until its existing capacity is filled', () => {
    expect(isOpenForInterest({ status: 'ACCEPTED', isMultiPerson: true })).toBe(true);
    expect(hasSelectionCapacity([{ status: 'ACCEPTED' }, { status: 'INTERESTED' }], 2)).toBe(true);
    expect(hasSelectionCapacity([{ status: 'ACCEPTED' }, { status: 'ACCEPTED' }], 2)).toBe(false);
  });
});
