/* eslint-disable max-classes-per-file */
import { is } from '@anupheaus/common';
import { SocketClientError } from '../common';
import { InvokeActionMessage } from '../common/internalSocketsModels';
import { decoratorsRegistry } from './decorators/decoratorsRegistry';
import { SocketClientController, ControllerInternalApi, SocketInternalApiStub, SocketInternalInvokeActionResponse, SocketServerClientApiTypeStub } from './internalSockets';
import { SocketControllerClientState } from './SocketModels';

type Constructor = new (...args: any[]) => {};

export type SocketController = InstanceType<ReturnType<ReturnType<typeof createSocketControllerStateWrapper>>>;

export function createSocketControllerStateWrapper<T extends SocketControllerClientState = SocketControllerClientState>() {
  function createSocketController<B extends Constructor>(Base: B, controllerId: string) {
    return class SocketControllerBase extends Base {
      constructor(...args: any[]) {
        super(...args);
        const api: ControllerInternalApi = {
          className: this.constructor.name,
          controllerId,
          invokeAction: action => this.#handleInvokeAction(action),
          getMethods: () => this.#getMethods(),
        };
        (this as any)[SocketInternalApiStub] = api;
      }

      [SocketServerClientApiTypeStub] = null as unknown as T;

      #handleInvokeAction(action: InvokeActionMessage): SocketInternalInvokeActionResponse {
        const descriptor = Reflect.getAllDefinitions(this)[action.methodName];
        if (descriptor == null) throw new SocketClientError(`No method found for "${action.methodName}" within controller id "${action.controllerId}"`);
        const decorators = decoratorsRegistry.get(descriptor);
        if (!decorators) throw new SocketClientError(`No socket controller decorators found on "${action.methodName}" within controller id "${action.controllerId}"`);
        const methodToInvoke = descriptor.value;
        if (!is.function(methodToInvoke)) throw new SocketClientError(`"${action.methodName}" within controller id "${action.controllerId}" was not a function.`);
        const response = (async () => methodToInvoke.call(this, ...action.args))();
        return {
          decorators,
          response,
        };
      }

      #getMethods(): string[] {
        const methodNames = Object.entries(Reflect.getAllDefinitions(this))
          .filter(([, descriptor]) => is.function(descriptor.value) && decoratorsRegistry.has(descriptor))
          .map(([name]) => name);
        return methodNames;
      }

      protected get client(): T { return SocketClientController.getStore() as T; }

    };
  }

  function createSocketControllerWithIdOnly(controllerId: string) {
    return createSocketController(class { }, controllerId);
  }

  function toSocketController(controllerId: string): ReturnType<typeof createSocketControllerWithIdOnly>;
  function toSocketController<B extends Constructor>(Base: B, controllerId: string): ReturnType<typeof createSocketController>;
  function toSocketController<B extends Constructor>(BaseOrControllerId: B | string, controllerId?: string) {
    if (is.string(BaseOrControllerId)) return createSocketControllerWithIdOnly(BaseOrControllerId);
    return createSocketController(BaseOrControllerId, controllerId!);
  }

  return toSocketController;
}
