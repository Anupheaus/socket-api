import { ServerControllerContext } from '../ServerModels';
import { SocketApiClient } from '../ServerClient';
import { SocketApiServer } from '../ServerServer';

export interface SocketApiContext {
  server: SocketApiServer;
  client: SocketApiClient;
  controllerContext: ServerControllerContext;
}