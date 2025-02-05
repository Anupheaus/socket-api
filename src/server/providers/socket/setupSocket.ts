import '@anupheaus/common';
import { Server } from 'socket.io';
import type { SocketContextProps } from './SocketContext';
import { provideLogger, useLogger } from '../logger';
import { Context } from '../../contexts';
import { SocketIOParser } from '../../../common';
import { is } from '@anupheaus/common';
import { provideSocket } from './internalUseSocket';
import { provideData } from '../data';
import type { AnyHttpServer } from '../../internalModels';

export function setupSocket(name: string, server: AnyHttpServer) {
  const logger = useLogger();

  logger.info('Preparing websocket...');
  const socket = new Server(server, {
    path: `/${name}`,
    transports: ['websocket'],
    serveClient: false,
    parser: new SocketIOParser({ logger }),
  });
  try {
    const onConnectedCallbacks = new Set<Parameters<SocketContextProps['onClientConnected']>[0]>();
    socket.on('connection', async client => {
      const clientLogger = logger.createSubLogger(client.id);

      clientLogger.info('Client connected', { IPAddress: client.handshake.address });

      const disconnectCallbacks = Array.from(onConnectedCallbacks)
        .mapWithoutNull(provideLogger(clientLogger, provideSocket(client, provideData(client, callback => callback({ client })))));

      client.on('disconnect', () => {
        clientLogger.info('Client disconnected');
        provideLogger(clientLogger, provideSocket(client, provideData(client, () => disconnectCallbacks.forEach(async potentialCb => {
          const cb = await potentialCb;
          if (!is.function(cb)) return;
          cb();
        }))));
      });
    });

    const onClientConnected: SocketContextProps['onClientConnected'] = (callback: Parameters<SocketContextProps['onClientConnected']>[0]) => {
      onConnectedCallbacks.add(callback);
    };

    Context.set<SocketContextProps>('socket', {
      socket,
      onClientConnected,
    });

    logger.info('Websocket ready, waiting for the server to start...');

    server.on('listening', () => {
      const address = server.address();
      const port = is.string(address) ? undefined : address?.port;
      logger.info(`Websocket listening on port ${port}.`);
    });

    server.on('close', () => {
      logger.info('Websocket closed due to the server being closed.');
    });

    return onClientConnected;


  } finally {
    // socket.close();
  }
}
