import { is } from '@anupheaus/common';
import { SocketController } from './SocketController';
import { SocketInternalApiStub } from './internalSockets';

export function isController(value: unknown): value is SocketController {
  if (!is.instance(value)) return false;
  return (value as any)[SocketInternalApiStub] != null;
}