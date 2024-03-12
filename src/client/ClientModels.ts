import { Logger } from '@anupheaus/common';
import { ControllerMetadata, ControllerMethodMetadata, SocketAPIError } from '../common';
import { Socket } from 'socket.io-client';

export interface ControllerProps {
  logger: Logger;
  metadata: ControllerMetadata[];
  useSocket(delegate: (socket: Socket) => (() => void) | void): void;
  getSocket(): Promise<Socket>;
  onHydrateResponse?(response: unknown, metadata: ControllerMethodMetadata): unknown;
  onDehydrateRequestArgs?(args: unknown[], metadata: ControllerMethodMetadata): unknown[];
}

export type MakeAsyncResponse<ResponseType> = ResponseType & {
  isLoading: boolean;
  error?: SocketAPIError;
};
