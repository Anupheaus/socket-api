import { io } from 'socket.io-client';
import { SocketIOParser } from '../../../common';
import type { Logger } from '@anupheaus/common';

export function createClientSocket(host: string | undefined, name: string, logger: Logger) {
  host = host ?? window.location.hostname;
  const url = `wss://${host}`;
  return io(url, {
    path: `/${name}`,
    transports: ['websocket', 'webtransport'],
    parser: new SocketIOParser({ logger }),
    secure: true,
    forceNew: true,
    autoConnect: false,
    forceBase64: true,
  });
}