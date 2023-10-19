import { AnyObject, Logger } from '@anupheaus/common';

const logger = new Logger('Socket-API');

export function createLogger(name: string, persistentMeta?: AnyObject) {
  return logger.createSubLogger(name, { persistentMeta });
}