import { CreateControllerFunctionProps } from './ClientControllerModels';

export function createControllerEffectFunc({ controllerName, methodName, logger, getSocket }: CreateControllerFunctionProps) {
  return async (...args: any[]) => {
    const socket = await getSocket();
    logger.silly(`Invoking effect "${methodName}" with args:`, args);
    return await socket.emitWithAck(`${controllerName}.${methodName}`, ...args);
  };
}
