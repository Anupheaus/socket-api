import { ControllerInstance, SocketAPIError, StoreRequest } from '../common';
import { AnyFunction, Record, UnPromise, Upsertable } from '@anupheaus/common';
import { useControllers } from './ControllersProvider/useControllers';
import { ControllerFunctionResponse, ControllerQueryResponse, StoreController } from '../server';

type AsyncResponse<T> = { response: T | undefined; error: SocketAPIError | undefined; isLoading: boolean; };

type ControllerQueryFunction<F extends AnyFunction> =
  UnPromise<ReturnType<F>> extends ControllerQueryResponse<infer R> ? (...args: Parameters<F>) => AsyncResponse<R> : never;

type ControllerPromiseFunction<F extends AnyFunction> = F extends (...args: Parameters<F>) => infer R
  ? (UnPromise<R> extends ControllerFunctionResponse<infer P> ? (...args: Parameters<F>) => Promise<P> : never) : never;

type ConvertControllerFunction<F> = F extends AnyFunction ? (
  ControllerQueryFunction<F> extends never ? ControllerPromiseFunction<F> : ControllerQueryFunction<F>
) : never;

type ValidControllerFunction<ControllerInstanceType extends ControllerInstance, FunctionName extends keyof ControllerInstanceType> =
  ControllerInstanceType[FunctionName] extends (...args: any[]) => infer R ? (UnPromise<R> extends ControllerFunctionResponse<unknown> ? FunctionName : never) : never;

type AddStoreControllerFunctions<ControllerInstanceType extends ControllerInstance> = ControllerInstanceType extends InstanceType<StoreController<infer RecordType>> ? StoreControllerFunctions<RecordType> : {};

type ConvertControllerFunctions<ControllerInstanceType extends ControllerInstance> = {
  [FunctionName in keyof ControllerInstanceType as ValidControllerFunction<ControllerInstanceType, FunctionName>]: ConvertControllerFunction<ControllerInstanceType[FunctionName]>;
} & AddStoreControllerFunctions<ControllerInstanceType>;

export interface ClientStoreResponse<T extends Record | string = Record> {
  data: T[];
  total: number;
  page?: number;
  pageSize?: number;
}

export interface ClientStoreAsyncResponse<T extends Record = Record> extends ClientStoreResponse<T> {
  isLoading: boolean;
  error?: SocketAPIError;
}

export type StoreControllerFunctions<T extends Record = Record> = {
  get(id: string): Promise<T | undefined>;
  request(request: StoreRequest<T>): Promise<ClientStoreResponse<T>>;
  upsert(record: Upsertable<T>): Promise<T>;
  remove(id: string): Promise<void>;
  useGet(id: string | undefined): AsyncResponse<T>;
  useRequest(request?: StoreRequest<T>): ClientStoreAsyncResponse<T>;
};

type ControllerFunctions<ControllersType extends ControllerInstance[], ControllerNamesType extends ControllerNames<ControllersType>> = {
  [ControllerInstanceType in ControllersType[number]as ControllerInstanceType['name']]: ConvertControllerFunctions<ControllerInstanceType>;
}[ControllerNamesType];

export type ControllerNames<Controllers extends ControllerInstance[]> = Controllers[number]['name'];

export function createUseController<C extends ControllerInstance[]>() {
  return function useController<K extends ControllerNames<C>>(name: K) {
    const { controllers, stores } = useControllers();
    const controller = controllers.get(name);
    const store = stores.get(name);
    if (!controller && !store) throw new SocketAPIError({ message: `No controller or store found with name "${name}"`, meta: { controllers: controllers.toKeysArray(), stores: stores.toKeysArray() } });

    return { ...controller, ...store?.createFunctions() ?? {} } as unknown as ControllerFunctions<C, K>;
  };
}