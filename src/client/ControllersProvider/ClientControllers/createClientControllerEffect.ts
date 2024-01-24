import { CreateControllerFunctionProps } from './ClientControllerModels';

export function createControllerEffectFunc({ controllerName, methodName, logger, getSocket, onDehydrateRequestArgs, onHydrateResponse }: CreateControllerFunctionProps) {
  return async (...args: any[]) => {
    args = onDehydrateRequestArgs(args, { name: methodName, type: 'effect' });
    const socket = await getSocket();
    logger.silly(`Invoking effect "${methodName}" with args:`, args);
    const result = await socket.emitWithAck(`${controllerName}.${methodName}`, ...args);
    return onHydrateResponse(result, { name: methodName, type: 'effect' });
  };
}
