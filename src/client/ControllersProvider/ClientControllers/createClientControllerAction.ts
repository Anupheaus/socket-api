import { CreateControllerFunctionProps } from './ClientControllerModels';

export function createControllerActionFunc({ controllerName, methodName, logger, getSocket }: CreateControllerFunctionProps) {
  return async (...args: any[]) => {
    const socket = await getSocket();
    logger.silly(`Invoking action "${methodName}" with args:`, args);
    return await socket.emitWithAck(`${controllerName}.${methodName}`, args);
  };
}
