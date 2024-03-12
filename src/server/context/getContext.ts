import { SocketAPIError } from '../../common';
import { contextAsyncStorage } from './contextAsyncStorage';
import { Context } from './contextModels';

export function getContext(): Context {
  const context = contextAsyncStorage.getStore();
  if (!context) throw new SocketAPIError({ message: 'Socket Api Context is not available' });
  return context;
}
