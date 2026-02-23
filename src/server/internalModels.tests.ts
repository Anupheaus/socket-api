import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ServerConfig } from './startServer';

describe('internalModels', () => {
  const mockConfig: ServerConfig = {
    name: 'test-socket',
    server: {} as ServerConfig['server'],
  };

  beforeEach(async () => {
    vi.resetModules();
    const { setServerConfig } = await import('./internalModels');
    setServerConfig(mockConfig);
  });

  describe('getServerConfig', () => {
    it('returns the config that was set', async () => {
      const { getServerConfig } = await import('./internalModels');
      const result = getServerConfig();
      expect(result).toBe(mockConfig);
      expect(result.name).toBe('test-socket');
    });

    it('throws when config has not been set', async () => {
      vi.resetModules();
      const { getServerConfig } = await import('./internalModels');
      expect(() => getServerConfig()).toThrow('Server config is not set');
    });
  });

  describe('setServerConfig', () => {
    it('allows updating the config', async () => {
      const { getServerConfig, setServerConfig } = await import('./internalModels');
      const newConfig: ServerConfig = {
        name: 'updated-socket',
        server: {} as ServerConfig['server'],
      };
      setServerConfig(newConfig);
      expect(getServerConfig()).toBe(newConfig);
      expect(getServerConfig().name).toBe('updated-socket');
    });
  });
});
