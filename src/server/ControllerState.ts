import { AnyFunction } from '@anupheaus/common';
import { AsyncLocalStorage } from 'async_hooks';
import { ControllerState } from './ControllerModels';

const AsyncControllerState = new AsyncLocalStorage<ControllerState>();

export function executeWithControllerState<F extends AnyFunction, C extends ControllerState>(state: C, delegate: F): ReturnType<F> {
  return AsyncControllerState.run(state, delegate);
}

export function getControllerState<C extends ControllerState>(): C {
  return AsyncControllerState.getStore() as C;
}
