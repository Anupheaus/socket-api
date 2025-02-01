import { Logger } from '@anupheaus/common';
import { createUILogger } from '@anupheaus/react-ui';

export const logger = new Logger('socket-api');

export const { LoggerProvider, useLogger } = createUILogger(logger);