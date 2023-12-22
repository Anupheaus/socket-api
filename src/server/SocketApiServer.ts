import { Server as HttpsServer } from 'https';
import { Server, Socket } from 'socket.io';
import { createLogger } from '../common/logger';
import { SocketApiClient } from './SocketApiClient';
import type { ControllerContext, ServerControllerMetadataMap } from './ServerControllerModels';
import { decoratorsRegistry } from './decorators/decoratorsRegistry';
import { PromiseMaybe } from '@anupheaus/common';
import { ControllerInstance } from '../common';

const logger = createLogger('SocketApiServer');

export interface SocketApiServerProps {
  server: HttpsServer;
  url: string;
  controllers: ControllerInstance[];
  onLoadContext?(context: ControllerContext, client: Socket): PromiseMaybe<ControllerContext>;
  onSaveContext?(context: ControllerContext, client: Socket): PromiseMaybe<ControllerContext>;
}

export class SocketApiServer {
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
  #connection: Server | undefined;

  public start() {
    const { url, server, controllers } = this.#props;
    logger.debug('Loading controller metadata...');
    const metadata = decoratorsRegistry.getMetadataFor(controllers, this);
    logger.debug('Loaded controller metadata', { metadata: metadata.toValuesArray().map(({ name, methodName, type }) => `${name}.${methodName} (${type})`) });

    logger.info('Starting Socket API');
    const io = new Server(server, { path: url, transports: ['websocket'], serveClient: false, cors: { origin: '*' } });
    this.#connection = io;

    // server events
    server.on('close', this.#handleHttpServerConnectionClosed());
    server.on('listening', this.#handleHttpServerConnectionOpen());
    server.on('error', error => logger.error('Error occurred', { error }));

    // socket events
    io.on('connection', this.#handleClientConnected(metadata));
  }

  public getController<ControllerType extends ControllerInstance>(controllerName: string): ControllerType | undefined {
    const { controllers } = this.#props;
    return controllers.find(({ name }) => name === controllerName) as ControllerType | undefined;
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

  #handleClientConnected(metadata: ServerControllerMetadataMap) {
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
