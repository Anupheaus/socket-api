import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import { createRequestLogger } from '../logger';
import type { AnyHttpServer } from '../../internalModels';

export function setupKoa(server: AnyHttpServer) {
  const app = new Koa();
  app.use(bodyParser());
  app.use(createRequestLogger());

  server.on('request', app.callback());

  return app;
}