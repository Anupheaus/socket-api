import { AnyObject, MakePromise, NotPromise, Unsubscribe } from '@anupheaus/common';

type UseControllerType<T extends AnyObject, K extends keyof T, S extends keyof T> =
  { [P in K]: T[P] extends (...args: infer A) => infer R ? (...args: A) => MakePromise<R> : () => MakePromise<T[P]>; } &
  { [P in S as P extends string ? `on${Capitalize<P>}` : never]: T[P] extends (...args: any[]) => infer R ? (callback: (result: NotPromise<R>) => void) => Unsubscribe : never; };

export function createUseControllerType<T extends AnyObject, K extends keyof T = keyof T, S extends keyof T = never>(name: string): UseControllerType<T, K, S> {
  return undefined as unknown as UseControllerType<T, K, S>;
}
