import { PromiseMaybe } from '@anupheaus/common';
import { Server as HttpsServer } from 'https';
import { Server, Socket } from 'socket.io';
import { createLogger } from '../common/logger';
import { SocketController } from './SocketController';
import { ControllerInternalApi, SocketInternalApiStub, SocketServerClientApiTypeStub } from './internalSockets';
import { SocketControllerClientState } from './SocketModels';
import { SocketApiClient } from './SocketApiClient';
import { SocketControllerMetadata } from '../common';

const logger = createLogger('SocketServer');

type GetClientApiTypeFrom<T extends SocketController> = PromiseMaybe<T[typeof SocketServerClientApiTypeStub]>;

export interface SocketServerProps<T extends SocketController> {
  server: HttpsServer;
  url: string;
  controllers: T[];
  modifyControllerClientState?(state: SocketControllerClientState, client: Socket): GetClientApiTypeFrom<T>;
}

export class SocketServer {
  private constructor(props: SocketServerProps<SocketController>) {
    this.#props = {
      modifyControllerClientState: state => state,
      ...props,
    };
    this.#clients = new Set();
    this.#startServer();
  }

  #props: Required<SocketServerProps<SocketController>>;
  #clients: Set<SocketApiClient<SocketController>>;

  static start<T extends SocketController>(props: SocketServerProps<T>): SocketServer { return new SocketServer(props); }

  #handleHttpServerConnectionClosed(socket: Server) {
    return () => {
      logger.info('Server is closing, closing socket server');
      socket.disconnectSockets(true);
    };
  }

  #handleHttpServerConnectionOpen() {
    const { url } = this.#props;
    return () => { logger.info('Server is started, listening for connections...', { url }); };
  }

  #handleClientMutation() {
    return (controllerIds: string[]) => {
      logger.debug('Client mutation', { controllerIds });
      this.#clients.forEach(client => client.processMutation(controllerIds));
    };
  }

  #handleClientConnected(controllerApis: Map<string, ControllerInternalApi>, metadata: SocketControllerMetadata[]) {
    return (connection: Socket) => {
      const IPAddress = connection.handshake.address;
      const clientId = connection.id;
      logger.info('Client connected', { clientId, IPAddress });
      const client = new SocketApiClient({
        connection,
        controllers: controllerApis,
        modifyControllerClientState: this.#props.modifyControllerClientState,
        onMutation: this.#handleClientMutation(),
      });
      this.#clients.add(client);

      logger.info('Sending metadata to client', { clientId, IPAddress });
      connection.emit('controllerMetadata', metadata);

      connection.on('disconnect', () => {
        logger.info('Client disconnected', { clientId, IPAddress });
        this.#clients.delete(client);
      });
    };
  }

  #startServer() {
    const { url, server, controllers } = this.#props;
    logger.debug('Loading controllers...');
    const [controllerApis, metadata] = this.#generateMetadata(controllers);
    logger.debug('Loaded Controllers', { controllerIds: controllerApis.toKeysArray(), metadata });

    logger.info('Starting Socket API', { url });
    const io = new Server(server, { path: url, transports: ['websocket'], serveClient: false, cors: { origin: '*' } });

    // server events
    server.on('close', this.#handleHttpServerConnectionClosed(io));
    server.on('listening', this.#handleHttpServerConnectionOpen());
    server.on('error', error => logger.error('Error occurred', { error }));

    // socket events
    io.on('connection', this.#handleClientConnected(controllerApis, metadata));
  }

  #generateMetadata(controllers: SocketController[]) {
    const controllerApis = new Map((controllers.map(c => (c as any)[SocketInternalApiStub]).removeNull() as ControllerInternalApi[]).map(api => [api.controllerId, api]));
    const metadata = controllerApis.toValuesArray().map((api): SocketControllerMetadata => ({ controllerId: api.controllerId, methodNames: api.getMethods() }));
    return [controllerApis, metadata] as const;
  }

}
