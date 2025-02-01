import { jwtDecode } from 'jwt-decode';
import type { SocketAPIUser } from './models';
import { InternalError, is } from '@anupheaus/common';

function extractUntrustedUserFromToken(token: string): SocketAPIUser | undefined {
  const data = jwtDecode(token) as SocketAPIUser | undefined | string;
  if (is.string(data)) throw new InternalError('The format of the token is invalid.');
  const user = data;
  if (user == null || !is.guid(user.id)) return;
  return user;
}

export const jwt = {
  extractUntrustedUserFromToken,
};
