import { AsyncLocalStorage } from 'async_hooks';
import type { AnyFunction, AnyObject } from '@anupheaus/common';

const DataStore = new WeakMap<AnyObject, Map<string, unknown>>();
export const DataAsyncStore = new AsyncLocalStorage<Map<string, unknown>>();

export function provideData<T extends AnyFunction>(target: AnyObject, handler: T) {
  const data = DataStore.set(target, DataStore.get(target) ?? new Map()).get(target)!;
  return ((...args) => DataAsyncStore.run(data, () => handler(...args))) as T;
}

function getData<T>(key: string, defaultValue: () => T): T;
function getData<T>(key: string): T | undefined;
function getData<T>(key: string, defaultValue?: () => T): T | undefined {
  const store = DataAsyncStore.getStore();
  if (store == null) throw new Error('UserData is not available at this location.');
  if (!store.has(key)) {
    if (defaultValue == null) return undefined;
    store.set(key, defaultValue());
  }
  return store.get(key) as T | undefined;
}

function setData<T>(key: string, value: T) {
  const store = DataAsyncStore.getStore();
  if (store == null) throw new Error('UserData is not available at this location.');
  store.set(key, value);
}

function isDataAvailable() {
  return DataAsyncStore.getStore() != null;
}

export function internalUseData() {
  return {
    getData,
    setData,
    isDataAvailable,
  };
}


