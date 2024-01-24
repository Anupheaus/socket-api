import { is } from '@anupheaus/common';
import { CreateControllerFunctionProps } from './ClientControllerModels';
import { hydrateError } from './ClientControllerUtils';

export function createControllerActionFunc({ controllerName, methodName, logger, getSocket, onHydrateResponse, onDehydrateRequestArgs }: CreateControllerFunctionProps) {
  return async (...args: any[]) => {
    args = onDehydrateRequestArgs(args, { name: methodName, type: 'action' });
    const socket = await getSocket();
    logger.silly(`Invoking action "${methodName}" with args:`, args);
    const result = await socket.emitWithAck(`${controllerName}.${methodName}`, ...args);
    if (is.plainObject(result) && Reflect.has(result, 'error')) {
      const error = hydrateError(result.error);
      if (error) throw error;
    }
    return onHydrateResponse(result, { name: methodName, type: 'action' });
  };
}
