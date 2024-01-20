import { ControllerInstance, SocketAPIError } from '../common';
import { AnyFunction, UnPromise } from '@anupheaus/common';
import { useControllers } from './ControllersProvider/useControllers';
import { ControllerFunctionResponse, ControllerQueryResponse } from '../server';

type ControllerQueryFunction<F extends AnyFunction> =
  UnPromise<ReturnType<F>> extends ControllerQueryResponse<infer R> ? (...args: Parameters<F>) => { response: R | undefined; error: SocketAPIError | undefined; isLoading: boolean; } : never;

type ControllerPromiseFunction<F extends AnyFunction> = F extends (...args: Parameters<F>) => infer R
  ? (UnPromise<R> extends ControllerFunctionResponse<infer P> ? (...args: Parameters<F>) => Promise<P> : never) : never;

type ConvertControllerFunction<F> = F extends AnyFunction ? (
  ControllerQueryFunction<F> extends never ? ControllerPromiseFunction<F> : ControllerQueryFunction<F>
) : never;

type ValidControllerFunction<ControllerInstanceType extends ControllerInstance, FunctionName extends keyof ControllerInstanceType> =
  ControllerInstanceType[FunctionName] extends (...args: any[]) => infer R ? (UnPromise<R> extends ControllerFunctionResponse<unknown> ? FunctionName : never) : never;

type ConvertControllerFunctions<ControllerInstanceType extends ControllerInstance> = {
  [FunctionName in keyof ControllerInstanceType as ValidControllerFunction<ControllerInstanceType, FunctionName>]: ConvertControllerFunction<ControllerInstanceType[FunctionName]>;
};

type ControllerFunctions<ControllersType extends ControllerInstance[], ControllerNamesType extends ControllerNames<ControllersType>> = {
  [ControllerInstanceType in ControllersType[number]as ControllerInstanceType['name']]: ConvertControllerFunctions<ControllerInstanceType>;
}[ControllerNamesType];

export type ControllerNames<Controllers extends ControllerInstance[]> = Controllers[number]['name'];

export function createUseController<C extends ControllerInstance[]>() {
  return function useController<K extends ControllerNames<C>>(name: K) {
    const { controllers } = useControllers();
    const controller = controllers.get(name);
    if (!controller) throw new SocketAPIError({ message: `No controller found with name "${name}"`, meta: { controllers: controllers.toKeysArray() } });
    return controller as unknown as ControllerFunctions<C, K>;
  };
}