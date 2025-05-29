import { Error, InternalError, is, useLogger, type PromiseMaybe } from '@anupheaus/common';
import { useSocketAPI } from '../providers';
import { AsyncLocalStorage } from 'async_hooks';

export type SocketAPIServerHandler = () => void;

export type SocketAPIServerHandlerFunction<Request, Response> = (request: Request) => PromiseMaybe<Response>;

const registeredHandlers = new Set<string>();

export function createServerHandler<Request, Response>(type: string, prefix: string, name: string, handler: SocketAPIServerHandlerFunction<Request, Response>): SocketAPIServerHandler {
  const fullName = `${prefix}.${name}`;
  const pascalType = type.toPascalCase();
  if (registeredHandlers.has(fullName)) throw new InternalError(`Handler for ${type} '${name}' already registered.`);
  registeredHandlers.add(fullName);
  return () => {
    const logger = useLogger();
    const { getClient } = useSocketAPI();
    const client = getClient(true);
    logger.silly(`Registering ${type}`);
    const runWithScope = AsyncLocalStorage.snapshot();
    client.on(fullName, (...args: unknown[]) => runWithScope(async () => {
      const requestId = Math.uniqueId();
      const response = args.pop();
      const startTime = performance.now();
      try {
        const result = await (handler as Function)(...args);
        const duration = performance.now() - startTime;
        logger.debug(`${name} ${pascalType} Invoked`, { args, result, requestId, duration: `${duration.toFixed(0)}ms` });
        if (is.function(response)) response(result);
      } catch (error) {
        logger.error(`${name} ${pascalType} Error`, { error, requestId });
        if (is.function(response)) response({ error: new Error({ error }) });
      }
    }));
  };
}

