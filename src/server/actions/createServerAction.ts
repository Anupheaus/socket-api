import { is, type PromiseMaybe } from '@anupheaus/common';
import type { SocketAPIAction } from '../../common';
import { provideLogger, useLogger, useSocketAPI } from '../providers';
import { actionPrefix } from '../../common/internalModels';

export type SocketAPIServerAction = () => void;

type SocketAPIServerActionHandler<Request, Response> = (request: Request) => PromiseMaybe<Response>;

const registeredActions = new Set<string>();

export function createServerAction<Name extends string, Request, Response>(action: SocketAPIAction<Name, Request, Response>, handler: SocketAPIServerActionHandler<Request, Response>): SocketAPIServerAction {
  if (registeredActions.has(action.name)) throw new Error(`Listener for action '${action.name}' already registered.`);
  registeredActions.add(action.name);
  return () => {
    const logger = useLogger();
    const { getClient } = useSocketAPI();
    const client = getClient(true);
    logger.silly('Registering action', { action: action.name });
    client.on(`${actionPrefix}.${action.name.toString()}`, provideLogger(logger, async (...args: unknown[]) => {
      const requestId = Math.uniqueId();
      const response = args.pop();
      logger.info('Action Invoked', { action: action.name, args, requestId });
      const result = await (handler as Function)(...args);
      logger.info('Action Result', { action: action.name, result, requestId });
      if (is.function(response)) response(result);
    }));
  };
}
