/* eslint-disable max-classes-per-file */
import { ConstructorOf } from '@anupheaus/common';
import { ControllerInstance, SocketAPIError } from '../common';
import { getContext } from './context';
import type { ControllerActionResponse, ControllerContext, ControllerEffectResponse, ControllerEventResponse, ControllerQueryResponse, ControllerRequest, ControllerRespond } from './ServerControllerModels';
import { ControllerResponseType } from './ControllerModelsInternal';

class AnyClass { }

export function createToController<ContextType extends ControllerContext>() {
  return <Name extends string, BaseType extends ConstructorOf<AnyClass>>(name: Name, Base?: BaseType) => {
    const BaseClass = (Base ?? AnyClass) as BaseType;
    return class Controller extends BaseClass {

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
            return {
              [ControllerResponseType]: {
                type: 'action',
              },
              ...response,
            } as ControllerActionResponse<T>;
          },
          asEvent<T = void>(response: T | void): ControllerEventResponse<T> {
            return {
              [ControllerResponseType]: {
                type: 'event',
              },
              ...response,
            } as ControllerEventResponse<T>;
          },
        };
      }

      protected useController<ControllerType extends ControllerInstance>(controllerName: string): ControllerType {
        const { server } = getContext();
        const controller = server.getController<ControllerType>(controllerName);
        if (!controller) throw new SocketAPIError({ message: `Controller "${controllerName}" not found` });
        return controller;
      }

    };
  };
}


class ControllerDefinitionHelper<ContextType extends ControllerContext> {
  public getType() { return createToController<ContextType>()('' as string, class { }); }
}

export type Controller<ContextType extends ControllerContext = ControllerContext> =
  ReturnType<ControllerDefinitionHelper<ContextType>['getType']>;
