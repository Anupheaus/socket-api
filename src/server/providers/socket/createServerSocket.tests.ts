import { describe, it, expect, vi } from 'vitest';
import { createServerSocket } from './createServerSocket';
import type { Server as HttpServer } from 'http';

describe('createServerSocket', () => {
  const mockLogger = {
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    silly: vi.fn(),
    provide: vi.fn((fn: () => unknown) => fn()),
  };

  it('returns a socket.io Server instance', () => {
    const mockServer = {} as HttpServer;
    const io = createServerSocket('test-socket', mockServer, mockLogger as never);
    expect(io).toBeDefined();
    expect(typeof io.emit).toBe('function');
    expect(typeof io.on).toBe('function');
  });

  it('creates server with provided name', () => {
    const mockServer = {} as HttpServer;
    const io = createServerSocket('mySocket', mockServer, mockLogger as never);
    expect(io).toBeDefined();
    expect(io).toBeInstanceOf(Object);
  });
});
