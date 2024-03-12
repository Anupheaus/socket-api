import { contextAsyncStorage } from './contextAsyncStorage';
import { Context } from './contextModels';

export function executeWithContext<T>(context: Context, delegate: () => T): T {
  return contextAsyncStorage.run(context, delegate);
}
