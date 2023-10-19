import { AnyObject } from '@anupheaus/common';

export type { SocketController } from '../server/SocketController';

export interface UpdateClientMessage<T = unknown> {
  hash: string;
  response: T;
}

export interface SocketControllerSerialisedError {
  errorClassName: string;
  serialisedError: AnyObject;
  title?: string;
  message?: string;
}

export interface SocketControllerMetadata {
  controllerId: string;
  methodNames: string[];
}
