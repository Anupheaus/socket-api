import { Context } from '../../contexts';
import type { SocketContextProps } from './SocketContext';
import { AsyncLocalStorage } from 'async_hooks';
import type { AnyFunction } from '@anupheaus/common';
import type { Socket } from 'socket.io';

export const SocketAsyncStore = new AsyncLocalStorage<Socket>();

export function provideSocket<T extends AnyFunction>(client: Socket, handler: T) {
  return ((...args) => SocketAsyncStore.run(client, () => handler(...args))) as T;
}

export function internalUseSocket() {
  const context = Context.get<SocketContextProps>('socket');
  if (context == null) throw new Error('Socket context is not available at this location.');

  function getClient(): Socket | undefined;
  function getClient(isRequired: true): Socket;
  function getClient(isRequired: false): Socket | undefined;
  function getClient(isRequired = false): Socket | undefined {
    const client = SocketAsyncStore.getStore();
    if (client == null && isRequired) throw new Error('Socket client is not available at this location.');
    return client;
  }

  return {
    ...context,
    getClient,
  };
}
