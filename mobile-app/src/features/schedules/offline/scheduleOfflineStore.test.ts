import { describe, expect, it } from 'vitest';
import { shouldServerVersionWin } from './conflictPolicy';

describe('offline schedule conflict policy', () => {
  it('keeps a newer server edit', () => {
    expect(
      shouldServerVersionWin('2026-07-23T05:00:01.000Z', '2026-07-23T05:00:00.000Z'),
    ).toBe(true);
  });

  it('replays a newer local edit', () => {
    expect(
      shouldServerVersionWin('2026-07-23T05:00:00.000Z', '2026-07-23T05:00:01.000Z'),
    ).toBe(false);
  });

  it('treats equal timestamps as local queue order', () => {
    expect(
      shouldServerVersionWin('2026-07-23T05:00:00.000Z', '2026-07-23T05:00:00.000Z'),
    ).toBe(false);
  });
});
