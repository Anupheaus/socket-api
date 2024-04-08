import { AnyFunction, ConstructorOf, UnPromise } from '@anupheaus/common';
import { ClientController, SocketAPIError } from '../common';
import type { StoreController } from '../server';
import { useContext } from 'react';
import { Contexts } from './ClientContext';
import type { StoreControllerFunctions } from './ClientStoreController';

type ControllerPromiseFunction<F extends AnyFunction> = F extends (...args: Parameters<F>) => infer R ? (...args: Parameters<F>) => Promise<UnPromise<R>> : never;

type ConvertControllerFunction<F> = F extends AnyFunction ? ControllerPromiseFunction<F> : never;

type ValidControllerFunctions<ControllerType extends ClientController> =
  ControllerType['exposedToClient'] extends PropertyKey[] ? ControllerType['exposedToClient'][number] : never;

export type AddStoreControllerFunctions<ControllerType extends ClientController> = ControllerType extends ConstructorOf<StoreController<infer RecordType>> ? StoreControllerFunctions<RecordType> : {};

type ConvertControllerFunctions<ControllerType extends ClientController> = {
  [FunctionName in ValidControllerFunctions<ControllerType>]: ConvertControllerFunction<InstanceType<ControllerType>[FunctionName]>;
} & AddStoreControllerFunctions<ControllerType>;

type ControllerFunctions<ControllersType extends ClientController[], ControllerNamesType extends ControllerNames<ControllersType>> = {
  [ControllerType in ControllersType[number]as ControllerType['name']]: ConvertControllerFunctions<ControllerType>;
}[ControllerNamesType];

export type ControllerNames<ControllerTypes extends ClientController[]> = ControllerTypes[number]['name'];

export function createUseController<ControllerTypes extends ClientController<any, any, any>[]>() {
  return function useController<ControllerName extends ControllerNames<ControllerTypes>>(name: ControllerName) {
    const { controllers } = useContext(Contexts.Controllers);
    const controller = controllers.get(name);
    if (!controller) throw new SocketAPIError({ message: `No controller found with name "${name}"`, meta: { controllers: controllers.toKeysArray() } });
    return controller as ControllerFunctions<ControllerTypes, ControllerName>;
  };
}

export type GetControllerNamesFrom<UseController extends ReturnType<typeof createUseController>> = Parameters<UseController>[0];
