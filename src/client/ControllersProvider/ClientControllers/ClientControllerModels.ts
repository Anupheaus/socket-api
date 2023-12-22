import { Logger } from '@anupheaus/common';
import { Socket } from 'socket.io-client';
import { ControllerMetadata } from '../../../common';
import { QueryManager } from './QueryManager';

export interface ClientControllerCommonProps {
  logger: Logger;
  useSocket(delegate: (socket: Socket) => (() => void) | void): void;
  getSocket(): Promise<Socket>;
}

export interface CreateControllerFunctionProps extends ClientControllerCommonProps {
  controllerName: string;
  methodName: string;
  methodType: ControllerMetadata['type'];
  queryManager: QueryManager;
}