import { useLogger, type AnyFunction } from '@anupheaus/common';
import type { SocketAPIUser } from '../../common';
import { internalUseAuthentication } from './authentication';
import { internalUseData, provideData } from './data';
import { internalUseSocket, provideSocket } from './socket';
import { provideLogger } from './logger';

export function useSocketAPI<UserType extends SocketAPIUser = SocketAPIUser>() {
  const socket = internalUseSocket();
  const data = internalUseData();
  const authentication = internalUseAuthentication<UserType>();

  function wrapWithSocketAPI<T extends AnyFunction>(handler: T) {
    const logger = useLogger();
    const client = socket.getClient(true);
    return provideLogger(logger, provideSocket(client, provideData(client, handler)));
  }

  return {
    ...socket,
    ...data,
    ...authentication,
    wrapWithSocketAPI,
  };
}
