import type { SocketAPIServerAction } from '../../src/server';
import { createServerAction, useSocketAPI } from '../../src/server';
import type { UserRecord } from '../common';
import { signIn, testEndpoint } from '../common';

export const actions: SocketAPIServerAction[] = [
  createServerAction(testEndpoint, async ({ foo }) => {
    return { bar: foo };
  }),
  createServerAction(signIn, async () => {
    const { setUser } = useSocketAPI<UserRecord>();
    setUser({ id: Math.uniqueId(), name: 'Tony Hales' });
    return true;
  }),
];
