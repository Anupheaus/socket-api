import { useLogger } from '../providers';
import type { SocketAPIServerAction } from './createServerAction';

export function setupActions(actions: SocketAPIServerAction[]) {
  if (actions.length === 0) return;
  const logger = useLogger();

  logger.debug('Setting up actions...');
  actions.forEach(action => action());
  logger.debug('Actions set up.');
}