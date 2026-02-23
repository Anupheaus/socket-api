import crypto from 'crypto';
import JWT from 'jsonwebtoken';
import { Error, InternalError, is } from '@anupheaus/common';
import { jwt as commonJwt } from '../common';
import type { SocketAPIUser } from '../common';

export interface GeneratedToken {
  token: string;
  publicKey: string;
  privateKey: string;
}

function extractUserFromToken(token: string, key: string): SocketAPIUser | undefined {
  try {
    const pemKey = Buffer.from(key, 'base64').toString('utf-8');
    const data = JWT.verify(token, pemKey, { issuer: 'socket-api', audience: 'socket-api' });
    if (is.string(data) || !is.plainObject(data) || !('user' in data)) throw new InternalError('The format of the token is invalid.');
    return data.user as SocketAPIUser;
  } catch (e) {
    if (e instanceof JWT.TokenExpiredError) {
      return;
    } else if (e instanceof Error) {
      throw new InternalError('An unexpected error occurred while verifying the token.', { error: e });
    } else {
      throw new InternalError('An unexpected error occurred while verifying the token.');
    }
  }
}

function createTokenFromUser(user: SocketAPIUser, providedPrivateKey?: string): GeneratedToken {
  const { rawPrivateKey, rawPublicKey } = (() => {
    if (is.empty(providedPrivateKey)) {
      const keyPair = crypto.generateKeyPairSync('rsa', {
        modulusLength: 4096,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem',
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem',
        },
      });
      return { rawPrivateKey: keyPair.privateKey, rawPublicKey: keyPair.publicKey };
    } else {
      const pubKeyObject = crypto.createPublicKey({
        key: providedPrivateKey,
        format: 'pem'
      });
      return { rawPrivateKey: providedPrivateKey, rawPublicKey: pubKeyObject.export({ format: 'pem', type: 'spki' }).toString('utf-8') };
    }
  })();

  // Fixed: algorithm must match key type - we use RSA keys so RS256 is correct (was ES256 which expects EC keys)
  const token = JWT.sign({ user }, rawPrivateKey, {
    algorithm: 'RS256', // was: algorithm: 'ES256',
    issuer: 'socket-api',
    audience: 'socket-api',
    expiresIn: '3d',
    encoding: 'utf-8',
    header: { alg: 'RS256' },
  });

  const privateKey = Buffer.from(rawPrivateKey, 'utf-8').toString('base64');
  const publicKey = Buffer.from(rawPublicKey, 'utf-8').toString('base64');

  return { token, publicKey, privateKey };
}

function encodePrivateKey(privateKey: string | undefined): string | undefined {
  if (is.empty(privateKey)) return undefined;
  return Buffer.from(privateKey, 'utf-8').toString('base64');
}

export const jwt = {
  createTokenFromUser,
  extractUserFromToken,
  extractUntrustedUserFromToken: commonJwt.extractUntrustedUserFromToken,
  encodePrivateKey,
};

