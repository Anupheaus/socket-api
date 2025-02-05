import { socketAPIAuthenticateTokenAction } from '../../common';
import { getServerConfig } from '../internalModels';
import { jwt } from '../jwt';
import { useSocketAPI } from '../providers';
import { createServerAction, type SocketAPIServerAction } from './createServerAction';

export function generateInternalActions(): SocketAPIServerAction[] {
  const { onLoadPrivateKey, privateKey: privateKeyFromConfig } = getServerConfig();
  return [
    createServerAction(socketAPIAuthenticateTokenAction, async token => {
      const { getClient } = useSocketAPI();
      const client = getClient(true);
      const untrustedUser = jwt.extractUntrustedUserFromToken(token);
      if (untrustedUser == null) return false;
      const privateKey = jwt.encodePrivateKey(privateKeyFromConfig) ?? await onLoadPrivateKey?.(client, untrustedUser);
      if (privateKey == null) return false;
      const user = jwt.extractUserFromToken(token, privateKey);
      if (user == null) return false;
      if (user.id !== untrustedUser.id) return false;
      return true;
    }),
  ];
}