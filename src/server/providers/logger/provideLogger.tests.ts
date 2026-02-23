import { describe, it, expect, vi } from 'vitest';
import { provideLogger } from './provideLogger';
import type { Logger } from '@anupheaus/common';

describe('provideLogger', () => {
  it('wraps handler to run within logger context', () => {
    const mockLogger = {
      provide: vi.fn((fn: () => number) => fn()),
    } as unknown as Logger;
    const handler = vi.fn(() => 42);
    const wrapped = provideLogger(mockLogger, handler);
    const result = wrapped();
    expect(handler).toHaveBeenCalled();
    expect(result).toBe(42);
    expect(mockLogger.provide).toHaveBeenCalledWith(expect.any(Function));
  });

  it('passes through arguments to the handler', () => {
    const mockLogger = {
      provide: vi.fn((fn: (a: number, b: string) => string) => fn(1, 'test')),
    } as unknown as Logger;
    const handler = vi.fn((a: number, b: string) => `${a}-${b}`);
    const wrapped = provideLogger(mockLogger, handler);
    const result = wrapped(1, 'test');
    expect(handler).toHaveBeenCalledWith(1, 'test');
    expect(result).toBe('1-test');
  });

  it('preserves handler return type', () => {
    const mockLogger = {
      provide: vi.fn((fn: () => Promise<string>) => fn()),
    } as unknown as Logger;
    const handler = async () => 'async-result';
    const wrapped = provideLogger(mockLogger, handler);
    return expect(wrapped()).resolves.toBe('async-result');
  });
});
