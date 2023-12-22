import { SocketAPIError } from '../../common';
import { contextAsyncStorage } from './contextAsyncStorage';
import { SocketApiContext } from './contextModels';

export function getContext(): SocketApiContext {
  const context = contextAsyncStorage.getStore();
  if (!context) throw new SocketAPIError({ message: 'Socket Api Context is not available' });
  return context;
}
