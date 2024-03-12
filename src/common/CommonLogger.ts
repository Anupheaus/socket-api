import { AnyObject, Logger } from '@anupheaus/common';

const logger = new Logger('Socket-API');

export function createLogger(name: string, globalMeta?: AnyObject) {
  return logger.createSubLogger(name, { globalMeta });
}