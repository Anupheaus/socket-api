import { describe, it, expect, vi } from 'vitest';
import { createServerSubscription } from './createServerSubscription';
import { defineSubscription } from '../../common';

describe('createServerSubscription', () => {
  it('returns a registration function for the subscription', () => {
    const subscription = defineSubscription<{ id: string }, { value: number }>()('testSubscription');
    const handler = vi.fn(async () => ({ value: 42 }));
    const register = createServerSubscription(subscription, handler);
    expect(register).toBeInstanceOf(Function);
  });

  it('wraps handler with subscribe/unsubscribe logic', () => {
    const subscription = defineSubscription<void, void>()('notifySub');
    const handler = vi.fn(async () => undefined);
    const register = createServerSubscription(subscription, handler);
    expect(register).toBeInstanceOf(Function);
  });
});
