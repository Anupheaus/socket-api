import { Logger } from '@anupheaus/common';
import { Socket } from 'socket.io-client';
import { ControllerMethodMetadata } from '../../../common';
import { QueryManager } from './QueryManager';

export interface ClientControllerCommonProps {
  logger: Logger;
  useSocket(delegate: (socket: Socket) => (() => void) | void): void;
  getSocket(): Promise<Socket>;
  onHydrateResponse(response: unknown, metadata: ControllerMethodMetadata): unknown;
  onDehydrateRequestArgs(args: unknown[], metadata: ControllerMethodMetadata): unknown[];
}

export interface CreateControllerFunctionProps extends ClientControllerCommonProps {
  controllerName: string;
  methodName: string;
  methodType: ControllerMethodMetadata['type'];
  queryManager: QueryManager;
}
