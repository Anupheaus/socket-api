import { Error, useLogger } from '@anupheaus/common';
import { socketAPIAuthenticateTokenAction } from '../../common';
import { getServerConfig } from '../internalModels';
import { jwt } from '../jwt';
import { useSocketAPI } from '../providers';
import { createServerAction, type SocketAPIServerAction } from './createServerAction';

export function generateInternalActions(): SocketAPIServerAction[] {
  const { onLoadPrivateKey, privateKey: privateKeyFromConfig } = getServerConfig();
  return [
    createServerAction(socketAPIAuthenticateTokenAction, async token => {
      const { getClient, setUser } = useSocketAPI();
      const logger = useLogger();
      const client = getClient(true);
      try {
        const untrustedUser = jwt.extractUntrustedUserFromToken(token);
        if (untrustedUser == null) return false;
        const privateKey = jwt.encodePrivateKey(privateKeyFromConfig) ?? await onLoadPrivateKey?.(client, untrustedUser);
        if (privateKey == null) return false;
        const user = jwt.extractUserFromToken(token, privateKey);
        if (user == null) return false;
        if (user.id !== untrustedUser.id) return false;
        await setUser(user);
        return true;
      } catch (error) {
        logger.error(new Error({ error }));
        return false;
      }
    }),
  ];
}