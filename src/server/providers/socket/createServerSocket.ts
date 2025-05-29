import { Server } from 'socket.io';
import type { AnyHttpServer } from '../../internalModels';
import { SocketIOParser } from '../../../common';
import type { Logger } from '@anupheaus/common';

const MAX_HTTP_BUFFER_SIZE = 1024 * 1024 * 10;

export function createServerSocket(name: string, server: AnyHttpServer, logger: Logger) {
  return new Server(server, {
    path: `/${name}`,
    transports: ['websocket'],
    serveClient: false,
    parser: new SocketIOParser({ logger }),
    maxHttpBufferSize: MAX_HTTP_BUFFER_SIZE,
  });
}
