// /* eslint-disable max-classes-per-file */
// import { ControllerInstance, SocketAPIError, StoreRequest, StoreResponse } from '../common';
// import { getContext } from './context';
// import type { ControllerActionResponse, ServerControllerContext, ControllerEffectResponse, ControllerEventResponse, ControllerQueryResponse, ControllerRespond } from './ServerModels';
// import { ConstructorOf, MergeMixinConstructor, Record } from '@anupheaus/common';

// class AnyClass { }

// export function createToController<ContextType extends ServerControllerContext>() {
//   const toController = <Name extends string, BaseType extends ConstructorOf<AnyClass>>(name: Name, Base: BaseType = AnyClass as BaseType) => {
//     class Controller extends Base {

//       public get name() { return name; }

//       protected get request(): ServerStoreControllerRequest {
//         const { client } = getContext();
//         return {
//           IPAddress: client.IPAddress,
//           url: client.url,
//         };
//       }

//       protected get context(): ContextType { return getContext().controllerContext as ContextType; }

//       protected get respond(): ControllerRespond {
//         return {
//           asQuery<T>(response?: T): ControllerQueryResponse<T> {
//             return response as ControllerQueryResponse<T>;
//           },
//           asEffect<T>(response?: T): ControllerEffectResponse<T> {
//             return response as ControllerEffectResponse<T>;
//           },
//           asAction<T = void>(response: T | void): ControllerActionResponse<T> {
//             return response as ControllerActionResponse<T>;
//           },
//           asEvent<T = void>(response: T | void): ControllerEventResponse<T> {
//             return response as ControllerEventResponse<T>;
//           },
//         };
//       }

//       protected useController<ControllerType extends ControllerInstance>(controllerName: string): ControllerType {
//         const { server } = getContext();
//         const controller = server.getController<ControllerType>(controllerName);
//         if (!controller) throw new SocketAPIError({ message: `Controller "${controllerName}" not found` });
//         return controller;
//       }

//     }
//     return Controller as unknown as MergeMixinConstructor<typeof Controller, BaseType>;
//   };

//   const toStoreController = <RecordType extends Record>() => <Name extends string, BaseType extends ConstructorOf<AnyClass>>(name: Name, Base: BaseType = AnyClass as BaseType) => {
//     class StoreController extends toController(name, Base) {

//       // eslint-disable-next-line @typescript-eslint/no-unused-vars
//       protected handleRequest(request: StoreRequest<RecordType>): Promise<StoreResponse<RecordType>> {
//         throw new SocketAPIError({ message: 'Controller Store method "handleRequest" has not been implemented.' });
//       }

//       // eslint-disable-next-line @typescript-eslint/no-unused-vars
//       protected handleGet(id: string): Promise<RecordType | undefined> {
//         throw new SocketAPIError({ message: 'Controller Store method "handleGet" has not been implemented.' });
//       }

//       // eslint-disable-next-line @typescript-eslint/no-unused-vars
//       protected handleUpsert(record: RecordType): Promise<RecordType> {
//         throw new SocketAPIError({ message: 'Controller Store method "handleUpsert" has not been implemented.' });
//       }

//       // eslint-disable-next-line @typescript-eslint/no-unused-vars
//       protected handleRemove(id: string): Promise<void> {
//         throw new SocketAPIError({ message: 'Controller Store method "handleRemove" has not been implemented.' });
//       }

//     }
//     return StoreController as unknown as MergeMixinConstructor<typeof StoreController, BaseType>;
//   };

//   return {
//     toController,
//     toStoreController,
//   };
// }


// class ControllerDefinitionHelper<RecordType extends Record, ContextType extends ServerControllerContext> {
//   public getControllerType() { return createToController<ContextType>().toController('' as string, class { }); }
//   public getStoreControllerType() { return createToController<ContextType>().toStoreController<RecordType>()('' as string, class { }); }
// }

// export type Controller<ContextType extends ServerControllerContext = ServerControllerContext> =
//   ReturnType<ControllerDefinitionHelper<Record, ContextType>['getControllerType']>;

// export type StoreController<RecordType extends Record = Record, ContextType extends ServerControllerContext = ServerControllerContext> =
//   ReturnType<ControllerDefinitionHelper<RecordType, ContextType>['getStoreControllerType']>;

// export namespace StoreController {
//   export function isStore(instance: InstanceType<Controller> | undefined): instance is InstanceType<StoreController> {
//     if (instance == null) return false;
//     return Reflect.has(instance, 'handleRequest') && Reflect.has(instance, 'handleGet') && Reflect.has(instance, 'handleUpsert') && Reflect.has(instance, 'handleRemove');
//   }
// }
