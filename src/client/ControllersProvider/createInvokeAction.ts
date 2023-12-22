import { AnyObject, DeferredPromise, Logger } from '@anupheaus/common';
import { useBound } from '@anupheaus/react-ui';
import { MutableRefObject } from 'react';
import { Socket } from 'socket.io-client';
import { ControllerError } from '../../common';
import { InvokeActionMessage, InvokeActionMessageResponse } from '../../common/internalSocketsModels';

interface Props {
  socketRef: MutableRefObject<DeferredPromise<Socket>>;
  responseCache: Map<string, Promise<unknown>>;
  logger: Logger;
  timeout: number;
  hydrateError(error: AnyObject): ControllerError;
}

export function createInvokeAction({ socketRef, logger, responseCache, timeout, hydrateError }: Props) {
  return useBound(async (action: InvokeActionMessage): Promise<unknown> => {
    const socket = await socketRef.current;
    const socketId = socket.id;
    logger.info('Invoke action requested', { socketId, action });
    const cachedResponse = responseCache.get(action.hash);
    if (cachedResponse) {
      logger.info('Cached action response found, returning response', { socketId, action });
      return cachedResponse;
    }

    const promise = new Promise((resolve, reject) => {
      logger.debug('Sending request to server', { socketId, action });
      socket.timeout(timeout).emit('invokeAction', action, (connectionError: Error, { response, canBeCached }: InvokeActionMessageResponse, serverError?: AnyObject) => {
        if (connectionError || serverError) {
          const error = hydrateError(serverError ?? connectionError);
          logger.error('Error received from server connection', { socketId, action, error });
          logger.trace('Removing the action from cache as the error should not be cached', { socketId, action });
          responseCache.delete(action.hash); // delete any cached response
          return reject(error);
        }
        logger.info('Action response received', { socketId, action, canBeCached });
        if (!canBeCached) {
          logger.trace('Removing the action from cache as the response cannot be cached', { socketId, action, canBeCached });
          responseCache.delete(action.hash);
        }
        resolve(response);
      });
    });
    logger.debug('Caching action response promise', { socketId, action });
    responseCache.set(action.hash, promise);
    return promise;
  });
}