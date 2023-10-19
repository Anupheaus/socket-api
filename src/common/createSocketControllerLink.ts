import { ClientServerControllerId } from './internalSocketsModels';
import { SocketController } from './SocketsModels';

export type SocketControllerLink<T extends SocketController> = T;

export function createSocketControllerLink<T extends SocketController>(linkId: string): SocketControllerLink<T> {
  return {
    [ClientServerControllerId]: linkId,
  } as unknown as T;
}
