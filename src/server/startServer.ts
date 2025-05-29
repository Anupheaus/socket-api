import type { PromiseMaybe } from '@anupheaus/common';
import { Logger } from '@anupheaus/common';
import { setServerConfig, type AnyHttpServer } from './internalModels';
import { setupSocket, setupKoa } from './providers';
import type { SocketAPIServerAction } from './actions';
import { generateInternalActions } from './actions';
import type { Socket } from 'socket.io';
import type { SocketAPIClientLoggingService, SocketAPIUser } from '../common';
import type { SocketAPIServerSubscription } from './subscriptions';
import { setupHandlers } from './handler';

export interface ServerConfig {
  name: string;
  actions?: SocketAPIServerAction[];
  subscriptions?: SocketAPIServerSubscription[];
  logger?: Logger;
  server: AnyHttpServer;
  privateKey?: string; // used for encrypting the jwt tokens
  clientLoggingService?: SocketAPIClientLoggingService;
  contextWrapper?<R>(delegate: () => (R | void)): (R | void);
  onStartup?(): PromiseMaybe<void>;
  onClientConnected?(client: Socket): PromiseMaybe<void>;
  onClientDisconnected?(client: Socket): PromiseMaybe<void>;
  onSavePrivateKey?(client: Socket, user: SocketAPIUser, privateKey: string): PromiseMaybe<void>;
  onLoadPrivateKey?(client: Socket, user: SocketAPIUser): PromiseMaybe<string | undefined>;
}

export async function startServer(config: ServerConfig) {
  setServerConfig(config);
  const {
    name,
    server,
    actions,
    subscriptions,
    logger: providedLogger,
    clientLoggingService,
    onClientConnected: propsOnClientConnected,
    onClientDisconnected,
  } = config;
  const logger = providedLogger ?? new Logger('MXDB_Sync');
  return logger.provide(async () => {
    const app = setupKoa(server);
    const onClientConnected = setupSocket(name, server, logger, clientLoggingService);
    const contextWrapper = config.contextWrapper ?? (delegate => delegate());
    if (config.onStartup) await contextWrapper(config.onStartup);
    const internalActions = generateInternalActions();
    onClientConnected(({ client }) => contextWrapper(() => {
      setupHandlers([...internalActions, ...(actions ?? []), ...(subscriptions ?? [])]);
      propsOnClientConnected?.(client);
      return innerClient => contextWrapper(() => onClientDisconnected?.(innerClient));
    }));

    return {
      app,
    };
  });
}
