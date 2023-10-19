import { AnyObject, Error } from '@anupheaus/common';

export class SocketServerError extends Error {
  constructor(message: string, meta?: AnyObject) {
    super({
      title: 'Socket Server Error',
      message,
      statusCode: 500,
      isAsync: true,
      meta,
    });
  }
}