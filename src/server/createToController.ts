/* eslint-disable max-classes-per-file */
import { ControllerInstance, SocketAPIError } from '../common';
import { getContext } from './context';
import type { ControllerActionResponse, ControllerContext, ControllerEffectResponse, ControllerEventResponse, ControllerQueryResponse, ControllerRequest, ControllerRespond } from './ServerControllerModels';
import { ConstructorOf, MergeMixinConstructor } from '@anupheaus/common';

class AnyClass { }

export function createToController<ContextType extends ControllerContext>() {
  return <Name extends string, BaseType extends ConstructorOf<AnyClass>>(name: Name, Base: BaseType = AnyClass as BaseType) => {
    class Controller extends Base {

      public get name() { return name; }

      protected get request(): ControllerRequest {
        const { client } = getContext();
        return {
          IPAddress: client.IPAddress,
          url: client.url,
        };
      }

      protected get context(): ContextType { return getContext().controllerContext as ContextType; }

      protected get respond(): ControllerRespond {
        return {
          asQuery<T>(response?: T): ControllerQueryResponse<T> {
            return response as ControllerQueryResponse<T>;
          },
          asEffect<T>(response?: T): ControllerEffectResponse<T> {
            return response as ControllerEffectResponse<T>;
          },
          asAction<T = void>(response: T | void): ControllerActionResponse<T> {
            return response as ControllerActionResponse<T>;
          },
          asEvent<T = void>(response: T | void): ControllerEventResponse<T> {
            return response as ControllerEventResponse<T>;
          },
        };
      }

      protected useController<ControllerType extends ControllerInstance>(controllerName: string): ControllerType {
        const { server } = getContext();
        const controller = server.getController<ControllerType>(controllerName);
        if (!controller) throw new SocketAPIError({ message: `Controller "${controllerName}" not found` });
        return controller;
      }

    }
    return Controller as unknown as MergeMixinConstructor<typeof Controller, BaseType>;
  };
}


class ControllerDefinitionHelper<ContextType extends ControllerContext> {
  public getType() { return createToController<ContextType>()('' as string, class { }); }
}

export type Controller<ContextType extends ControllerContext = ControllerContext> =
  ReturnType<ControllerDefinitionHelper<ContextType>['getType']>;
