import type { SocketAPIUser } from '../../../common';
import { socketAPIUserAuthenticated, socketAPIUserSignOut } from '../../../common/internalEvents';
import { Context } from '../../contexts';
import { useEvent } from '../../events';
import { getServerConfig } from '../../internalModels';
import { jwt } from '../../jwt';
import { ClientAsyncStore } from './provideClient';
import type { SocketContextProps } from './SocketContext';

interface SocketAPIAuthenticationData<UserType extends SocketAPIUser> {
  user?: UserType;
  token?: string;
  privateKey?: string;
  publicKey?: string;
}

function getData<T>(key: string, defaultValue: () => T): T;
function getData<T>(key: string): T | undefined;
function getData<T>(key: string, defaultValue?: () => T): T | undefined {
  const store = ClientAsyncStore.getStore();
  if (store == null) throw new Error('UserData is not available at this location.');
  if (!store.data.has(key)) {
    if (defaultValue == null) return undefined;
    store.data.set(key, defaultValue());
  }
  return store.data.get(key);
}

function setData<T>(key: string, value: T) {
  const store = ClientAsyncStore.getStore();
  if (store == null) throw new Error('UserData is not available at this location.');
  store.data.set(key, value);
}

function isDataAvailable() {
  return ClientAsyncStore.getStore() != null;
}

function getClient() {
  const store = ClientAsyncStore.getStore();
  if (store == null) throw new Error('client is not available in the current context, it must be called within a connected client context.');
  return store.client;
}

function getUser<UserType extends SocketAPIUser = SocketAPIUser>() {
  return getData<SocketAPIAuthenticationData<UserType>>('socket-api-user', () => ({})).user;
}

async function setUser<UserType extends SocketAPIUser = SocketAPIUser>(user: UserType | undefined) {
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
    const { onSavePrivateKey, privateKey: providedPrivateKey } = getServerConfig();
    const { token, privateKey, publicKey } = jwt.createTokenFromUser(user, providedPrivateKey);
    authenticationData.token = token;
    authenticationData.privateKey = privateKey;
    authenticationData.publicKey = publicKey;
    await onSavePrivateKey?.(client, user, privateKey);
    userAuthenticated({ token, publicKey });
  }
}


export function useSocketAPI<UserType extends SocketAPIUser = SocketAPIUser>() {
  const socket = Context.get<SocketContextProps>('socket');

  return {
    ...socket,
    get client() { return getClient(); },
    getData,
    setData,
    getUser: getUser<UserType>,
    setUser: setUser<UserType>,
    isDataAvailable,
  };
}
