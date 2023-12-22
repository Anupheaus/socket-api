import { AsyncLocalStorage } from 'async_hooks';
import { SocketApiContext } from './contextModels';

export const contextAsyncStorage = new AsyncLocalStorage<SocketApiContext>();