import { Server as HttpsServer } from 'https';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { createLogger } from '../common/CommonLogger';
import { Client } from './ServerClient';
import type { ControllerContext, ControllerMetadata } from './ServerModels';
import { PromiseMaybe } from '@anupheaus/common';
import { Controller } from './ServerController';
import { createMetadataFromControllers } from './ServerMetadataGenerator';
import { ClientController, ControllerMethodMetadata, SocketAPIError, StoreControllerUpdate } from '../common';

const logger = createLogger('SocketApiServer');

export interface SocketApiServerProps {
  server: HttpsServer;
  url: string;
  controllers: Controller[];
  onLoadContext?(context: ControllerContext, client: Socket): PromiseMaybe<ControllerContext>;
  onSaveContext?(context: ControllerContext, client: Socket): PromiseMaybe<ControllerContext>;
  onHydrateArgs?(args: unknown[], metadata: ControllerMethodMetadata): PromiseMaybe<unknown[]>;
}

export class Server {
  constructor(props: SocketApiServerProps) {
    this.#props = {
      onLoadContext: context => context,
      onSaveContext: context => context,
      onHydrateArgs: args => args,
      ...props,
    };
    this.#assignSelfToControllers(props.controllers);
    this.#clients = new Set();
  }

  #props: Required<SocketApiServerProps>;
  #clients: Set<Client>;
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

  public getController<ControllerType extends ClientController>(controllerName: string): ControllerType | undefined {
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

  #handleClientConnected(metadata: Map<string, ControllerMetadata>) {
    return (connection: Socket) => {
      const { onLoadContext, onSaveContext, onHydrateArgs } = this.#props;
      const IPAddress = connection.handshake.address;
      const clientId = connection.id;
      logger.info('Client connected', { clientId, IPAddress });
      try {
        const client = new Client({
          server: this,
          connection,
          metadata,
          onLoadContext,
          onSaveContext,
          onHydrateArgs,
        });
        this.#clients.add(client);

        connection.on('disconnect', () => {
          logger.info('Client disconnected', { clientId, IPAddress });
          this.#clients.delete(client);
        });
      } catch (error) {
        connection.emit('error', new SocketAPIError({ message: 'Error occurred while creating client', error }));
        connection.disconnect(true);
        logger.error('Error occurred while creating client', { error });
      }
    };
  }

  #assignSelfToControllers(controllers: Controller[]) {
    controllers.forEach(controller => {
      (controller as any).setParent(this);
    });
  }

  public async emit(eventName: string, ...args: unknown[]): Promise<void> {
    if (this.#connection == null) return;
    logger.debug(`Emitting event "${eventName}" to all clients...`, { args });
    this.#connection.emit(eventName, ...args);
  }

  public broadcastStoreUpdates(storeName: string, updates: StoreControllerUpdate[]): void {
    this.#clients.forEach(client => client.broadcastStoreUpdates(storeName, updates));
  }

}

export function createServer(config: SocketApiServerProps): void {
  const server = new Server(config);
  server.start();
}