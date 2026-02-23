import { describe, it, expect, vi } from 'vitest';
import { SocketIOParser } from './SocketIOParser';

describe('SocketIOParser', () => {
  const mockLogger = {
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    silly: vi.fn(),
    provide: vi.fn((fn: () => unknown) => fn()),
  };

  it('creates parser with Encoder and Decoder', () => {
    const parser = new SocketIOParser({ logger: mockLogger as never });
    expect(parser.Encoder).toBeDefined();
    expect(parser.Decoder).toBeDefined();
  });

  it('Encoder extends socket.io Encoder', () => {
    const parser = new SocketIOParser({ logger: mockLogger as never });
    expect(parser.Encoder.prototype.encode).toBeDefined();
  });

  it('Decoder extends socket.io Decoder', () => {
    const parser = new SocketIOParser({ logger: mockLogger as never });
    expect(parser.Decoder.prototype.on).toBeDefined();
  });
});
