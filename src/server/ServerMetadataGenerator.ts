import { ClientController } from '../common';
import { Controller } from './ServerController';
import { ControllerMetadata, ControllerMethodMetadata } from './ServerModels';
import { StoreController } from './ServerStoreController';

export function createMetadataFromControllers(controllers: Controller[]): Map<string, ControllerMetadata> {
  return new Map(controllers.map(controller => {
    const controllerType = controller.constructor as ClientController;
    const methods = new Map(((controllerType.exposedToClient ?? []) as string[]).map((methodName): [string, ControllerMethodMetadata] => {
      return [methodName, {
        name: methodName,
        type: 'action',
        invoke: async (...args: unknown[]) => Reflect.invoke(controller, methodName, ...args),
      }];
    }));
    return [controllerType.name, {
      name: controllerType.name,
      isStore: controller instanceof StoreController,
      methods,
    }];
  }));
}