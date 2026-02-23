import { describe, it, expect, vi } from 'vitest';
import { createServerAction } from './createServerAction';
import { defineAction } from '../../common';

describe('createServerAction', () => {
  it('returns a registration function for the action', () => {
    const action = defineAction<{ id: string }, { success: boolean }>()('testAction');
    const handler = vi.fn(async () => ({ success: true }));
    const register = createServerAction(action, handler);
    expect(register).toBeInstanceOf(Function);
  });

  it('wraps handler with correct action name', () => {
    const action = defineAction<void, void>()('noOpAction');
    const handler = vi.fn(async () => undefined);
    const register = createServerAction(action, handler);
    expect(register).toBeInstanceOf(Function);
    // Registration would require useSocketAPI/useLogger - we verify the function is returned
  });
});
