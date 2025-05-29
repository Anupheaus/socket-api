import '@anupheaus/common';
import type { SocketContextProps } from './SocketContext';
import { Context } from '../../contexts';
import type { Logger, LoggerEntry } from '@anupheaus/common';
import { is } from '@anupheaus/common';
import { provideSocket } from './internalUseSocket';
import { provideData } from '../data';
import type { AnyHttpServer } from '../../internalModels';
import { provideLogger } from '../logger';
import { createServerSocket } from './createServerSocket';
import { internalUseAuthentication } from '../authentication';
import type { SocketAPIClientLoggingService } from '../../../common';

export function setupSocket(name: string, server: AnyHttpServer, logger: Logger, clientLoggingService: SocketAPIClientLoggingService | undefined) {
  logger.info('Preparing websocket...');
  const socket = createServerSocket(name, server, logger);
  try {
    const onConnectedCallbacks = new Set<Parameters<SocketContextProps['onClientConnected']>[0]>();
    socket.on('connection', async client => {
      const clientLogger = logger.createSubLogger(client.id, { globalMeta: { clientId: client.id } });
      const userAgent = client.request.headers['user-agent'];
      const language = client.request.headers['accept-language'];
      const ipAddress = client.handshake.address;
      clientLogger.info('Client connected', { IPAddress: ipAddress, userAgent, language });

      const disconnectCallbacks = Array.from(onConnectedCallbacks)
        .mapWithoutNull(provideLogger(clientLogger, provideSocket(client, provideData(client, callback => callback({ client })))));

      const clientLoggerService = (entries: LoggerEntry[]) => {
        if (clientLoggingService == null) return;
        const { getUser } = internalUseAuthentication(client);
        const user = getUser();
        entries.forEach(entry => {
          const meta = entry.meta = entry.meta ?? {};
          meta.clientId = client.id;
          meta.source = 'client';
          meta.userAgent = userAgent;
          meta.language = language;
          meta.IPAddress = ipAddress;
          if (user != null) meta.userId = user.id;
        });
        clientLoggingService(client, user)(entries);
      };

      client.on('mxdb.log', clientLoggerService);

      client.on('disconnect', () => {
        clientLogger.info('Client disconnected');
        provideLogger(clientLogger, provideSocket(client, provideData(client, () => disconnectCallbacks.forEach(async potentialCb => {
          const cb = await potentialCb;
          if (!is.function(cb)) return;
          cb(client);
        }))))();
        client.off('mxdb.log', clientLoggerService);
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
