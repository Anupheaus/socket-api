import { AsyncLocalStorage } from 'async_hooks';
import { InvokeActionMessage } from '../common/internalSocketsModels';
import { SocketControllerClientState } from './SocketModels';

export type Constructor = new (...args: any[]) => {};

export const SocketServerClientApiTypeStub = Symbol('SocketServerClientTypeApi');

export const SocketClientController = new AsyncLocalStorage<SocketControllerClientState>();

export interface SocketInternalInvokeActionResponse {
  decorators: Decorators;
  response: Promise<unknown>;
}

export interface ControllerInternalApi {
  className: string;
  controllerId: string;
  invokeAction(action: InvokeActionMessage): SocketInternalInvokeActionResponse;
  getMethods(): string[];
}

export const SocketInternalApiStub = Symbol('SocketInternalApi');

export interface QueryDecorator {
  type: 'query';
}

export interface MutationDecorator {
  type: 'mutation';
  alsoMutates: string[];
}

export type Decorator = QueryDecorator | MutationDecorator;
export type Decorators = Decorator[];

export const DecoratedApiStub = Symbol('DecoratedApi');