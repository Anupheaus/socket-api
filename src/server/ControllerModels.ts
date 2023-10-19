import { AnyFunction, MapOf } from '@anupheaus/common';

export const InternalControllerConfig = Symbol('InternalControllerConfig');

export type ControllerQuery<F extends AnyFunction = AnyFunction> = F & {
  type: 'query';
};

export type ControllerSubscription<F extends AnyFunction = AnyFunction> = F & {
  type: 'subscription';
};

export type ControllerEffect<F extends AnyFunction = AnyFunction> = F & {
  type: 'effect';
};

export type ControllerAction<F extends AnyFunction = AnyFunction> = F & {
  type: 'action';
};

export type ControllerAnyFunction = ControllerQuery | ControllerSubscription | ControllerEffect | ControllerAction;

export interface ControllerState {
  IPAddress: string;
  url: string;
  token: string;
}

export interface ControllerFunctionsProps<S extends ControllerState> {
  getState(): S;
  createQuery<F extends AnyFunction>(handler: F): ControllerQuery<F>;
  createEvent<F extends AnyFunction>(handler: F): ControllerSubscription<F>;
  createEffect<F extends AnyFunction>(handler: F): ControllerAction<F>;
  createAction<F extends AnyFunction>(handler: F): ControllerAction<F>;
}

export interface ControllerConfig<S extends ControllerState = ControllerState, F extends ControllerAnyFunction = ControllerAnyFunction> {
  name: string;
  onLoadState?(state: S): S;
  onSaveState?(state: S): S;
  functions(functions: ControllerFunctionsProps<S>): MapOf<F>;
}

export interface InternalControllerConfig<S extends ControllerState = ControllerState> {
  name: string;
  functions: MapOf<ControllerAnyFunction>;
  onLoadState?(state: S): S;
  onSaveState?(state: S): S;
}

export type Controller<S extends ControllerState = ControllerState, F extends MapOf<AnyFunction> = MapOf<AnyFunction>> = F & {
  [InternalControllerConfig]: InternalControllerConfig<S>;
};

export type ControllerActionRequest = {
  args: any[];
  controllerName: string;
  functionName: string;
};
