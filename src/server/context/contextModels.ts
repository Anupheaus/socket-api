import { ControllerContext } from '../ServerControllerModels';
import { SocketApiClient } from '../SocketApiClient';
import { SocketApiServer } from '../SocketApiServer';

export interface SocketApiContext {
  server: SocketApiServer;
  client: SocketApiClient;
  controllerContext: ControllerContext;
}