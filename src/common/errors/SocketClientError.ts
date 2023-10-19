import { AnyObject, Error } from '@anupheaus/common';

export class SocketClientError extends Error {
  constructor(message: string, meta?: AnyObject) {
    super({
      title: 'Socket Client Error',
      message,
      statusCode: 400,
      isAsync: true,
      meta,
    });
  }
}