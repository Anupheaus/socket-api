import { ControllerContext } from '../ServerModels';
import { Client } from '../ServerClient';
import { Server } from '../ServerServer';

export interface Context {
  server: Server;
  client: Client;
  context: ControllerContext;
}