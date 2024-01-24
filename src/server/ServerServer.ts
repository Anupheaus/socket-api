import { Server as HttpsServer } from 'https';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { createLogger } from '../common/logger';
import { SocketApiClient } from './ServerClient';
import type { ServerControllerContext, ServerControllerMetadata } from './ServerModels';
import { PromiseMaybe } from '@anupheaus/common';
import { Controller } from './ServerController';
import { createMetadataFromControllers } from './ServerMetadataGenerator';

const logger = createLogger('SocketApiServer');

export interface SocketApiServerProps {
  server: HttpsServer;
  url: string;
  controllers: Controller[];
  onLoadContext?(context: ServerControllerContext, client: Socket): PromiseMaybe<ServerControllerContext>;
  onSaveContext?(context: ServerControllerContext, client: Socket): PromiseMaybe<ServerControllerContext>;
}

export class Server {
  constructor(props: SocketApiServerProps) {
    this.#props = {
      onLoadContext: context => context,
      onSaveContext: context => context,
      ...props,
    };
    this.#clients = new Set();
  }

  #props: Required<SocketApiServerProps>;
  #clients: Set<SocketApiClient>;
  #connection: SocketIOServer | undefined;

  public start() {
    const { url, server, controllers } = this.#props;
    logger.debug('Loading controller metadata...');
    const metadata = createMetadataFromControllers(controllers);
    logger.debug('Loaded controller metadata', {
      metadata: metadata.map((name, { methods, isStore }) => ({
        name,
        isStore,
        methods: methods.map((methodName, { type }) => `${methodName} (${type})`),
      })),
    });

    logger.info('Starting Socket API');
    const io = new SocketIOServer(server, { path: url, transports: ['websocket'], serveClient: false, cors: { origin: '*' } });
    this.#connection = io;

    // server events
    server.on('close', this.#handleHttpServerConnectionClosed());
    server.on('listening', this.#handleHttpServerConnectionOpen());
    server.on('error', error => logger.error('Error occurred', { error }));

    // socket events
    io.on('connection', this.#handleClientConnected(metadata));
  }

  public getController<ControllerType extends Controller>(controllerName: string): ControllerType | undefined {
    const { controllers } = this.#props;
    return controllers.find(controller => controller.constructor.name === controllerName) as ControllerType | undefined;
  }

  #handleHttpServerConnectionClosed() {
    return () => {
      if (this.#connection == null) return;
      logger.info('Server is closing, closing socket server');
      this.#connection.disconnectSockets(true);
      this.#connection = undefined;
    };
  }

  #handleHttpServerConnectionOpen() {
    const { url } = this.#props;
    return () => { logger.info('Server is started, listening for connections...', { url }); };
  }

  #handleClientConnected(metadata: Map<string, ServerControllerMetadata>) {
    return (connection: Socket) => {
      const { onLoadContext, onSaveContext } = this.#props;
      const IPAddress = connection.handshake.address;
      const clientId = connection.id;
      logger.info('Client connected', { clientId, IPAddress });
      const client = new SocketApiClient({
        server: this,
        connection,
        metadata,
        onLoadContext,
        onSaveContext,
      });
      this.#clients.add(client);

      connection.on('disconnect', () => {
        logger.info('Client disconnected', { clientId, IPAddress });
        this.#clients.delete(client);
      });
    };
  }

  public async processQueries(instanceId: string): Promise<void> {
    const clients = Array.from(this.#clients);
    await Promise.all(clients.map(client => client.processQueries(instanceId)));
  }

  public async emit(eventName: string, ...args: unknown[]): Promise<void> {
    if (this.#connection == null) return;
    logger.debug(`Emitting event "${eventName}" to all clients...`, { args });
    this.#connection.emit(eventName, ...args);
  }

}

export function createServer(config: SocketApiServerProps): void {
  const server = new Server(config);
  server.start();
}