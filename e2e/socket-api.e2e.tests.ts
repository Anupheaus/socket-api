import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { io } from 'socket.io-client';
import http from 'http';
import { config } from 'dotenv';
import { Logger } from '@anupheaus/common';
import { startServer, createServerAction, createServerSubscription } from '../src/server';
import { defineAction, defineSubscription } from '../src/common';
import { actions } from '../test/server/configureActions';
import { testPrivateKey } from '../test/server/private-key';

config();

const testFailingAction = defineAction<void, void>()('testFailing');
const tickSubscription = defineSubscription<{ intervalMs: number; }, { count: number; }>()('tickSubscription');

const e2eActions = [
  ...actions,
  createServerAction(testFailingAction, async () => {
    throw new Error('Intentional failure for e2e test');
  }),
];

const e2eSubscriptions = [
  createServerSubscription(tickSubscription, async ({ request, update, onUnsubscribe }) => {
    let count = 0;
    const interval = setInterval(() => {
      count++;
      update({ count });
    }, request.intervalMs);
    onUnsubscribe(() => clearInterval(interval));
    return { count: 0 };
  }),
];

function createSocket(port: number, socketName: string) {
  return io(`http://localhost:${port}`, {
    path: `/${socketName}`,
    transports: ['websocket'],
    autoConnect: true,
  });
}

function connect(socket: ReturnType<typeof io>) {
  return new Promise<void>((resolve, reject) => {
    socket.on('connect', () => resolve());
    socket.on('connect_error', err => reject(err));
  });
}

describe('socket-api e2e', () => {
  let server: http.Server;
  let port: number;
  const socketName = 'test';

  beforeAll(async () => {
    server = http.createServer();
    const logger = new Logger('socket-api-e2e');
    await startServer({
      name: socketName,
      logger,
      actions: e2eActions,
      subscriptions: e2eSubscriptions,
      server,
      privateKey: testPrivateKey,
    });
    await new Promise<void>(resolve => {
      server.listen(0, () => {
        const addr = server.address();
        port = typeof addr === 'object' && addr ? addr.port : 0;
        resolve();
      });
    });
  }, 15000);

  afterAll(() => {
    server?.close();
  });

  describe('connection', () => {
    it('connects to the server', async () => {
      const socket = createSocket(port, socketName);
      await connect(socket);
      expect(socket.connected).toBe(true);
      socket.disconnect();
    });

    it('handles multiple concurrent connections', async () => {
      const sockets = Array.from({ length: 5 }, () => createSocket(port, socketName));
      await Promise.all(sockets.map(connect));
      expect(sockets.every(s => s.connected)).toBe(true);
      sockets.forEach(s => s.disconnect());
    });

    it('can reconnect after disconnect', async () => {
      const socket = createSocket(port, socketName);
      await connect(socket);
      socket.disconnect();
      await new Promise(r => setTimeout(r, 50));
      socket.connect();
      await connect(socket);
      expect(socket.connected).toBe(true);
      socket.disconnect();
    });
  });

  describe('actions', () => {
    it('calls test action and receives response', async () => {
      const socket = createSocket(port, socketName);
      await connect(socket);

      const result = await socket.emitWithAck('socket-api.actions.test', { foo: 'hello' });
      expect(result).toEqual({ bar: 'hello' });

      socket.disconnect();
    });

    it('passes through request data correctly', async () => {
      const socket = createSocket(port, socketName);
      await connect(socket);

      const result = await socket.emitWithAck('socket-api.actions.test', { foo: 'complex-value-123' });
      expect(result).toEqual({ bar: 'complex-value-123' });

      socket.disconnect();
    });

    it('returns error object when action throws', async () => {
      const socket = createSocket(port, socketName);
      await connect(socket);

      const result = await socket.emitWithAck('socket-api.actions.testFailing');
      expect(result).toBeDefined();
      expect(result).toHaveProperty('error');
      expect((result as { error: { message?: string; }; }).error?.message).toContain('Intentional failure');

      socket.disconnect();
    });
  });

  describe('authentication', () => {
    it('calls signIn and receives success', async () => {
      const socket = createSocket(port, socketName);
      await connect(socket);

      const result = await socket.emitWithAck('socket-api.actions.signIn', {
        email: 'test@example.com',
        password: 'password',
      });
      expect(result).toBe(true);

      socket.disconnect();
    });

    it('receives token and publicKey after signIn, then authenticates', async () => {
      const socket = createSocket(port, socketName);

      let token: string | undefined;
      let publicKey: string | undefined;
      socket.on('socket-api.events.socketAPIUserAuthenticated', (payload: unknown) => {
        const p = typeof payload === 'string' ? JSON.parse(payload) : payload;
        token = (p as { token?: string; }).token;
        publicKey = (p as { publicKey?: string; }).publicKey;
      });

      await connect(socket);
      await socket.emitWithAck('socket-api.actions.signIn', { email: 'x', password: 'y' });

      await new Promise(r => setTimeout(r, 100));

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(publicKey).toBeDefined();

      const authResult = await socket.emitWithAck(
        'socket-api.actions.socketAPIAuthenticateTokenAction',
        token
      );
      expect(authResult).toBe(true);

      socket.disconnect();
    });

    it('rejects invalid token for authenticate action', async () => {
      const socket = createSocket(port, socketName);
      await connect(socket);

      const result = await socket.emitWithAck(
        'socket-api.actions.socketAPIAuthenticateTokenAction',
        'invalid-jwt-token'
      );
      expect(result).toBe(false);

      socket.disconnect();
    });
  });

  describe('subscriptions', () => {
    it('subscribes and receives initial response', async () => {
      const socket = createSocket(port, socketName);
      await connect(socket);

      const subscriptionId = `sub-${Date.now()}`;
      const result = await socket.emitWithAck('socket-api.subscriptions.tickSubscription', {
        action: 'subscribe',
        request: { intervalMs: 200 },
        subscriptionId,
      });

      expect(result).toEqual({ subscriptionId, response: { count: 0 } });

      socket.disconnect();
    });

    it('subscribes, receives streaming updates, then unsubscribes', async () => {
      const socket = createSocket(port, socketName);
      await connect(socket);

      const subscriptionId = `sub-${Date.now()}`;
      const updates: { count: number; }[] = [];

      socket.on('socket-api.subscriptions.tickSubscription', (payload: unknown) => {
        const p = typeof payload === 'string' ? JSON.parse(payload) : payload;
        const data = p as { subscriptionId?: string; response?: { count: number; }; };
        if (data?.subscriptionId === subscriptionId && data?.response != null) {
          updates.push(data.response);
        }
      });

      await socket.emitWithAck('socket-api.subscriptions.tickSubscription', {
        action: 'subscribe',
        request: { intervalMs: 50 },
        subscriptionId,
      });

      await new Promise(r => setTimeout(r, 200));

      expect(updates.length).toBeGreaterThanOrEqual(2);

      const unsubResult = await socket.emitWithAck('socket-api.subscriptions.tickSubscription', {
        action: 'unsubscribe',
        subscriptionId,
      });
      expect(unsubResult).toEqual({ subscriptionId, response: undefined });

      const countBeforeUnsub = updates.length;
      await new Promise(r => setTimeout(r, 150));
      expect(updates.length).toBe(countBeforeUnsub);

      socket.disconnect();
    });
  });

  describe('full flow', () => {
    it('connects, signs in, calls action, then disconnects', async () => {
      const socket = createSocket(port, socketName);
      await connect(socket);

      const signInResult = await socket.emitWithAck('socket-api.actions.signIn', {
        email: 'user@test.com',
        password: 'secret',
      });
      expect(signInResult).toBe(true);

      const actionResult = await socket.emitWithAck('socket-api.actions.test', { foo: 'authenticated' });
      expect(actionResult).toEqual({ bar: 'authenticated' });

      socket.disconnect();
    });
  });
});
