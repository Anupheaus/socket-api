import { AsyncLocalStorage } from 'async_hooks';
import { Context } from './contextModels';

export const contextAsyncStorage = new AsyncLocalStorage<Context>();