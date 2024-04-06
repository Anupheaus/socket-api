import { contextAsyncStorage } from './contextAsyncStorage';
import { Context } from './contextModels';

export function executeWithClientContext<T>(context: Context, delegate: () => T): T {
  return contextAsyncStorage.run(context, delegate);
}
