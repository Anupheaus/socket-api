import type { AnyObject, MakePromise } from '@anupheaus/common';
import type { SocketAPIUser } from '../../../common';
import { socketAPIUserAuthenticated, socketAPIUserSignOut } from '../../../common/internalEvents';
import { useEvent } from '../../events';
import { getServerConfig } from '../../internalModels';
import { jwt } from '../../jwt';
import { internalUseData, provideData } from '../data';
import { internalUseSocket } from '../socket';

interface SocketAPIAuthenticationData<UserType extends SocketAPIUser> {
  user?: UserType;
  token?: string;
  privateKey?: string;
  publicKey?: string;
}

export function internalUseAuthentication<UserType extends SocketAPIUser = SocketAPIUser>(target?: AnyObject) {
  const { getData } = internalUseData(target);

  function getUser() {
    return getData<SocketAPIAuthenticationData<UserType>>('socket-api-authentication', () => ({})).user;
  }

  async function setUserInternally(user: UserType | undefined, ignoreClient: boolean = false) {
    const { getClient } = internalUseSocket();
    const userAuthenticated = useEvent(socketAPIUserAuthenticated);
    const userSignOut = useEvent(socketAPIUserSignOut);

    const authenticationData = getData<SocketAPIAuthenticationData<UserType>>('socket-api-authentication', () => ({}));
    if (user == null) {
      if (authenticationData.token != null) return;
      authenticationData.token = undefined;
      authenticationData.privateKey = undefined;
      authenticationData.publicKey = undefined;
      userSignOut();
    } else {
      const client = getClient();
      if (!ignoreClient && client == null) throw new Error('Client is not available at this location.');
      const { onSavePrivateKey, privateKey: providedPrivateKey } = getServerConfig();
      const { token, privateKey, publicKey } = jwt.createTokenFromUser(user, providedPrivateKey);
      authenticationData.token = token;
      authenticationData.privateKey = privateKey;
      authenticationData.publicKey = publicKey;
      authenticationData.user = user;

      if (!ignoreClient && client != null) {
        await onSavePrivateKey?.(client, user, privateKey);
        userAuthenticated({ token, publicKey });
      }
    }
  }


  async function setUser(user: UserType | undefined) {
    const { getClient } = internalUseSocket();
    const userAuthenticated = useEvent(socketAPIUserAuthenticated);
    const userSignOut = useEvent(socketAPIUserSignOut);

    const authenticationData = getData<SocketAPIAuthenticationData<UserType>>('socket-api-authentication', () => ({}));
    if (user == null) {
      if (authenticationData.token != null) return;
      authenticationData.token = undefined;
      authenticationData.privateKey = undefined;
      authenticationData.publicKey = undefined;
      userSignOut();
    } else {
      const client = getClient();
      if (client == null) throw new Error('Client is not available at this location.');
      const { onSavePrivateKey, privateKey: providedPrivateKey } = getServerConfig();
      const { token, privateKey, publicKey } = jwt.createTokenFromUser(user, providedPrivateKey);
      authenticationData.token = token;
      authenticationData.privateKey = privateKey;
      authenticationData.publicKey = publicKey;
      authenticationData.user = user;
      await onSavePrivateKey?.(client, user, privateKey);
      userAuthenticated({ token, publicKey });
    }
  }

  function impersonateUser<ImpersonatedUserType extends SocketAPIUser, T>(user: ImpersonatedUserType, handler: () => T): MakePromise<T> {
    const newTarget = {};
    return provideData(newTarget, async () => {
      await setUserInternally(user as unknown as UserType, true);
      return handler();
    })() as MakePromise<T>;
  }


  return {
    getUser,
    setUser,
    impersonateUser,
  };
}
