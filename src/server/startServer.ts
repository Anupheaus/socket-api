import type { Logger, PromiseMaybe } from '@anupheaus/common';
import { setServerConfig, type AnyHttpServer } from './internalModels';
import { setupSocket, setupLogger, setupKoa } from './providers';
import type { SocketAPIServerAction } from './actions';
import { generateInternalActions, setupActions } from './actions';
import type { Socket } from 'socket.io';
import type { SocketAPIUser } from '../common';

export interface ServerConfig {
  name: string;
  actions?: SocketAPIServerAction[];
  logger?: Logger;
  server: AnyHttpServer;
  privateKey?: string;
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
    logger: providedLogger,
    onClientConnected: propsOnClientConnected,
  } = config;
  setupLogger(providedLogger);
  const app = setupKoa(server);
  const onClientConnected = setupSocket(name, server);
  await config.onStartup?.();
  const internalActions = generateInternalActions();
  onClientConnected(async ({ client }) => {
    setupActions([...internalActions, ...(actions ?? [])]);
    await propsOnClientConnected?.(client);
  });
  return {
    app,
  };
}
