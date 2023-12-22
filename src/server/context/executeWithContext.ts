import { contextAsyncStorage } from './contextAsyncStorage';
import { SocketApiContext } from './contextModels';

export function executeWithContext<T>(context: SocketApiContext, delegate: () => T): T {
  return contextAsyncStorage.run(context, delegate);
}
