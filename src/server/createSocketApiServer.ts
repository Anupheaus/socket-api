import { SocketApiServer } from './SocketApiServer';

type SocketApiServerProps = ConstructorParameters<typeof SocketApiServer>[0];

export function createSocketApiServer(config: SocketApiServerProps): void {
  const server = new SocketApiServer(config);
  server.start();
}