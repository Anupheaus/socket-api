import type Koa from 'koa';
import type { AnyHttpServer } from '../../internalModels';

export interface KoaContextProps {
  app: Koa;
  server: AnyHttpServer;
}
