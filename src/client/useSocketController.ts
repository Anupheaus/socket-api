// import { ArgumentInvalidError, Error, is, PromiseState } from '@anupheaus/common';
// import { useBound, useDelegatedBound, useId, useOnUnmount } from '@anupheaus/react-ui';
// import { useContext, useLayoutEffect, useMemo, useRef, useState } from 'react';
// import { ClientServerControllerId, InvokeActionMessage } from '../common/internalSocketsModels';
// import { SocketControllersContext } from './SocketControllersContext';

// const delegateHashes = new WeakMap<Function, () => string | undefined>();

// interface AsyncResponse<T> {
//   data?: T;
//   error?: Error;
//   isLoading: boolean;
// }

// type EnsurePromise<T> = T extends (...args: infer A) => infer P ? P extends Promise<any> ? (...args: A) => P : (...args: A) => Promise<P> : never;

// type ConvertedSocketController<T> = {
//   useAsync<P>(delegate: () => Promise<P>, dependencies?: unknown[]): AsyncResponse<P>;
// } & { [K in keyof T as T[K] extends (...args: any[]) => any ? K : never]: EnsurePromise<T[K]>; };

// function registerForUpdatesFromHashes(valuesToCheckForHashes: unknown[], listenForUpdatesOn: (hashes: string[]) => void) {
//   const hashes = valuesToCheckForHashes.map(value => {
//     if (!is.function(value)) return;
//     return delegateHashes.get(value)?.();
//   }).removeNull();
//   listenForUpdatesOn(hashes);
// }

// interface InvokeActionState<P> {
//   data?: P;
//   error?: Error;
// }

// export function useSocketController<T extends SocketController = SocketController>(controllerName: string): ConvertedSocketController<T>;
// export function useSocketController<T extends SocketController>(controller: SocketControllerLink<T>): ConvertedSocketController<T>;
// export function useSocketController<T extends SocketController>(controller: SocketControllerLink<T> | string): ConvertedSocketController<T> {
//   const { controllerMetadata, invokeAction, listenForUpdates } = useContext(SocketControllersContext);
//   const controllerId = is.string(controller) ? controller : is.plainObject(controller) ? (controller as any)[ClientServerControllerId] : undefined;
//   const controllerMethodNames = controllerMetadata.get(controllerId);
//   if (!is.string(controllerId) || !is.array(controllerMethodNames)) throw new ArgumentInvalidError('store', controller);

//   const delegate = useDelegatedBound((methodName: string, hashProp: { hash: string | undefined; }) => async (...args: any[]) => {
//     const message: InvokeActionMessage = {
//       controllerId,
//       methodName,
//       args,
//       hash: '',
//     };
//     message.hash = Object.hash(message);
//     hashProp.hash = message.hash;
//     return invokeAction(message);
//   });

//   const useAsync = useBound(<P>(asyncDelegate: () => Promise<P>, dependencies = Array.empty()) => {
//     const id = useId();
//     const [state, setState] = useState<InvokeActionState<P>>({ data: undefined, error: undefined });
//     const hasFinishedRenderingPhase = useRef(useMemo(() => Promise.createDeferred(), []));
//     if (hasFinishedRenderingPhase.current.state !== PromiseState.Pending) hasFinishedRenderingPhase.current = Promise.createDeferred();
//     const isLoadingRef = useRef(false);
//     const hasUnmounted = useOnUnmount();
//     const listenForUpdatesOn = listenForUpdates(id, async data => {
//       await hasFinishedRenderingPhase.current;
//       if (hasUnmounted()) return;
//       setState({ data: data as P, error: undefined });
//     });

//     useMemo(() => {
//       isLoadingRef.current = true;
//       const response = asyncDelegate();
//       registerForUpdatesFromHashes(dependencies.concat(asyncDelegate), listenForUpdatesOn);
//       response
//         .then(async data => {
//           await hasFinishedRenderingPhase.current;
//           if (hasUnmounted()) return;
//           isLoadingRef.current = false;
//           setState({ data, error: undefined });
//         }, async error => {
//           await hasFinishedRenderingPhase.current;
//           if (hasUnmounted()) return;
//           isLoadingRef.current = false;
//           setState({ data: undefined, error });
//         });
//     }, dependencies);

//     useLayoutEffect(() => hasFinishedRenderingPhase.current.resolve()); // at the end of every rendering phase

//     return {
//       ...state,
//       get isLoading() { return isLoadingRef.current; },
//     };
//   });


//   const controllerMethods = useMemo(() => {
//     const createStubFor = (methodName: string) => {
//       const hashProp = { hash: undefined };
//       const func = delegate(methodName, hashProp);
//       delegateHashes.set(func, () => hashProp.hash);
//       return func;
//     };
//     return controllerMethodNames.reduce((map, methodName) => ({
//       ...map,
//       [methodName]: createStubFor(methodName),
//     }), {});
//   }, [controllerMethodNames]);

//   return {
//     useAsync,
//     ...controllerMethods,
//   } as ConvertedSocketController<T>;
// }
