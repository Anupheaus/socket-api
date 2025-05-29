import { useLogger } from '@anupheaus/common';
import type { SocketAPIServerHandler } from './createServerHandler';

export function setupHandlers(handlers: SocketAPIServerHandler[]) {
  if (handlers.length === 0) return;
  const logger = useLogger();

  logger.debug('Setting up handlers...');
  handlers.forEach(handler => handler());
  logger.debug('Handlers set up.');
}
