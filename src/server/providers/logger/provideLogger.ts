import type { AnyFunction, Logger } from '@anupheaus/common';

export function provideLogger<T extends AnyFunction>(logger: Logger, handler: T) {
  return ((...args) => logger.provide(() => handler(...args))) as T;
}
