// import { AnyFunction, MapOf } from '@anupheaus/common';
import type { Controller as ServerControllerType } from '../server';

export interface ControllerQuerySubscription {
  query: {
    hash: string;
    action: 'subscribe' | 'unsubscribe';
  };
  payload?: unknown[];
}

export interface ControllerQueryUpdate {
  queryHash: string;
  results: unknown;
}

// export type RemoveStateFromFunction<FunctionType extends AnyFunction, ContextType extends ControllerContext> =
//   FunctionType extends (...args: [...infer ParametersType, ContextType]) => infer ReturnType ? (...args: ParametersType) => ReturnType : FunctionType;

// export type ControllerQuery<FunctionType extends AnyFunction = AnyFunction, ContextType extends ControllerContext = ControllerContext> = RemoveStateFromFunction<FunctionType, ContextType> & {
//   type: 'query';
// };

// export type ControllerEvent<FunctionType extends AnyFunction = AnyFunction, ContextType extends ControllerContext = ControllerContext> = RemoveStateFromFunction<FunctionType, ContextType> & {
//   type: 'event';
// };

// export type ControllerEffect<FunctionType extends AnyFunction = AnyFunction, ContextType extends ControllerContext = ControllerContext> = RemoveStateFromFunction<FunctionType, ContextType> & {
//   type: 'effect';
// };

// export type ControllerAction<FunctionType extends AnyFunction = AnyFunction, ContextType extends ControllerContext = ControllerContext> = RemoveStateFromFunction<FunctionType, ContextType> & {
//   type: 'action';
// };

// export type ControllerAnyFunction = ControllerQuery | ControllerEvent | ControllerEffect | ControllerAction;

// export interface InternalControllerConfig<ContextType extends ControllerContext = ControllerContext, ConfigType extends ControllerConfig<ContextType> = ControllerConfig<ContextType>> {
//   name: ConfigType['name'];
//   functions: ReturnType<ConfigType['functions']>;
//   onBeforeExecute?(state: ContextType): ContextType;
//   onAfterExecute?(state: ContextType): ContextType;
// }

// export interface ControllerFunctionsProps<ContextType extends ControllerContext> {
//   createQuery<FunctionType extends AnyFunction>(handler: FunctionType): ControllerQuery<FunctionType, ContextType>;
//   createEvent<FunctionType extends AnyFunction>(handler: FunctionType): ControllerEvent<FunctionType, ContextType>;
//   createEffect<FunctionType extends AnyFunction>(handler: FunctionType): ControllerEffect<FunctionType, ContextType>;
//   createAction<FunctionType extends AnyFunction>(handler: FunctionType): ControllerAction<FunctionType, ContextType>;
// }

// export interface ControllerConfig<ContextType extends ControllerContext = ControllerContext, F extends ControllerAnyFunction = ControllerAnyFunction> {
//   name: string;
//   onLoadState?(state: ContextType): ContextType;
//   onSaveState?(state: ContextType): ContextType;
//   functions(functions: ControllerFunctionsProps<ContextType>): MapOf<F>;
// }

// export interface ControllerContext {
//   token: string;
// }

// // export const InternalControllerConfig = Symbol('InternalControllerConfig');

// // export type ControllerNames<ControllerType extends Controller[]> = ControllerType[number][typeof InternalControllerConfig]['name'];
// // export type ControllerFunctions<ControllerType extends Controller[], ControllerNamesType extends ControllerNames<ControllerType>> = {
// //   [ControllerConfigType in ControllerType[number][typeof InternalControllerConfig] as ControllerConfigType['name']]: ControllerConfigType['functions'];
// // }[ControllerNamesType];

export type Controller = ServerControllerType;
export type ControllerInstance = InstanceType<Controller>;
// // export type Controller<ContextType extends ControllerContext = ControllerContext, ConfigType extends ControllerConfig<ContextType> = ControllerConfig<ContextType>> = {
// //   [InternalControllerConfig]: InternalControllerConfig<ContextType, ConfigType>;
// // };

export interface ControllerMetadata {
  name: string;
  methodName: string;
  type: 'query' | 'event' | 'effect' | 'action';
}
