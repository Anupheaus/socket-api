import { Logger } from '@anupheaus/common';
import { ControllerConfig, ControllerState } from './ControllerModels';
import { createControllerAction } from './createControllerAction';

interface CreateUseControllerConfig<S extends ControllerState, C extends ControllerConfig[]> {
  defaultState: S;
  controllers: C;
  logger: Logger;
}

type NamesOfControllers<C extends ControllerConfig[]> = C[number]['name'];
type FunctionsOfControllers<C extends ControllerConfig[], K extends NamesOfControllers<C>> =
  C[number]['name'] extends K ? ReturnType<C[number]['functions']> : never;

interface Props {
  controller: ControllerConfig;
  logger: Logger;
}

function createControllerFunctions({ controller, logger }: Props) {
  return controller.functions({
    getState,
    createAction: createControllerAction({ controller, logger }),
    createEffect,
    createEvent,
    createQuery,
  });
}

export function createUseController<S extends ControllerState>() {
  return function <C extends ControllerConfig[]>({ defaultState, controllers, logger }: CreateUseControllerConfig<S, C>) {

    const useControllers = controllers.reduce((map, controller) => ({
      ...map,
      [controller.name]: createControllerFunctions({ controller, logger }),
    }), {}) as Record<NamesOfControllers<C>, FunctionsOfControllers<C, NamesOfControllers<C>>>;

    return function useController<K extends NamesOfControllers<C>>(name: K) { return useControllers[name] as FunctionsOfControllers<C, K>; };
  };
}