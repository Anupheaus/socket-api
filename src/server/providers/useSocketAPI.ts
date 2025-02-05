import type { SocketAPIUser } from '../../common';
import { internalUseAuthentication } from './authentication';
import { internalUseData } from './data';
import { internalUseSocket } from './socket';

export function useSocketAPI<UserType extends SocketAPIUser = SocketAPIUser>() {
  const socket = internalUseSocket();
  const data = internalUseData();
  const authentication = internalUseAuthentication<UserType>();

  return {
    ...socket,
    ...data,
    ...authentication,
  };
}
