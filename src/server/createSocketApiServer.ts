import { Controller, InternalControllerConfig } from './ControllerModels';
import { Server as HttpsServer } from 'https';
import { Server, Socket } from 'socket.io';
import { createLogger } from '../common/logger';
import { SocketApiClient } from './SocketApiClient';

const logger = createLogger('SocketAPIServer');

type GetControllerStateFrom<T extends Controller[]> = Parameters<NonNullable<T[number][typeof InternalControllerConfig]['onLoadState']>>[0]; // Parameters<>[0];

export interface SocketApiServerConfig<T extends Controller[]> {
  server: HttpsServer;
  url?: string;
  controllers: T;
  onLoadState?<S extends GetControllerStateFrom<T>>(state: S, client: Socket): S;
  onSaveState?<S extends GetControllerStateFrom<T>>(state: S, client: Socket): S;
  onError?(error: Error): void;
}

export function createSocketApiServer<T extends Controller[]>(config: SocketApiServerConfig<T>): void {
  const {
    server,
    url = '/api/socket',
    controllers: rawControllers,
    onLoadState,
    onSaveState,
    onError,
  } = config;
  const clients = new Set<SocketApiClient>();

  logger.debug('Loading controllers...');
  const controllers = rawControllers.map(controller => controller[InternalControllerConfig]);
  logger.debug('Loaded Controllers', { controllers });

  logger.info('Starting Socket API', { url });
  const io = new Server(server, { path: url, transports: ['websocket'], serveClient: false, cors: { origin: '*' } });

  /** SERVER CLOSE */
  server.on('close', () => {
    logger.info('Server is closing, closing socket server');
    io.disconnectSockets(true);
  });

  /** SERVER OPEN */
  server.on('listening', () => {
    logger.info('Server is started, listening for connections...', { url });
  });

  /** SERVER ERROR */
  server.on('error', error => {
    if (onError) return onError(error);
    logger.error('Server error', { error });
  });

  /** WEBSOCKET CLIENT */
  io.on('connection', clientConnection => {
    const IPAddress = clientConnection.handshake.address;
    const clientId = clientConnection.id;
    logger.info('Client connected', { clientId, IPAddress });
    const client = new SocketApiClient({ connection: clientConnection, controllers, onLoadState, onSaveState });
    clients.add(client);

    clientConnection.on('disconnect', () => {
      logger.info('Client disconnected', { clientId, IPAddress });
      clients.delete(client);
    });
  });
}