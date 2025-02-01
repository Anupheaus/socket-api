// import { type AnyFunction } from '@anupheaus/common';
// import { ClientAsyncStore } from './provideClient';

// export function useClient() {
//   const store = ClientAsyncStore.getStore();

//   function getData<T>(key: string, defaultValue: () => T): T;
//   function getData<T>(key: string): T | undefined;
//   function getData<T>(key: string, defaultValue?: () => T): T | undefined {
//     const scopedStore = ClientAsyncStore.getStore();
//     if (scopedStore == null) throw new Error('UserData is not available at this location.');
//     if (!scopedStore.data.has(key)) {
//       if (defaultValue == null) return undefined;
//       scopedStore.data.set(key, defaultValue());
//     }
//     return scopedStore.data.get(key);
//   }

//   function setData<T>(key: string, value: T) {
//     const scopedStore = ClientAsyncStore.getStore();
//     if (scopedStore == null) throw new Error('UserData is not available at this location.');
//     scopedStore.data.set(key, value);
//   }

//   function provideClient<T extends AnyFunction>(handler: T) {
//     if (store == null) throw new Error('provideClient is not available in the current context, it must be called within a connected client context.');
//     return ((...args: Parameters<T>) => ClientAsyncStore.run(store, () => handler(...args))) as T;
//   }

//   function isDataAvailable() {
//     return ClientAsyncStore.getStore() != null;
//   }

//   return {
//     get client() {
//       if (store == null) throw new Error('client is not available in the current context, it must be called within a connected client context.');
//       return store.client;
//     },
//     provideClient,
//     getData,
//     setData,
//     isDataAvailable,
//   };
// }
