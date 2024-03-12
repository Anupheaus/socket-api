import { is } from '@anupheaus/common';
import { ControllerMetadata, ControllerMethodMetadata } from '../common';
import { ControllerProps } from './ClientModels';
import { hydrateError } from './ClientHydrateError';

interface CreateFunctionProps extends ControllerProps, Omit<ControllerMetadata, 'name' | 'methods'>, ControllerMethodMetadata {
  controllerName: string;
}

function createFunctionFor({ controllerName, name, type, logger, getSocket, onDehydrateRequestArgs, onHydrateResponse }: CreateFunctionProps) {
  return async (...args: any[]) => {
    const socket = await getSocket();
    args = Object.clone(args);
    if (onDehydrateRequestArgs) args = onDehydrateRequestArgs(args, { name, type });
    logger.silly(`Invoking action "${name}" with args:`, args);
    const result = await socket.emitWithAck(`${controllerName}.${name}`, ...args);
    if (is.plainObject(result) && Reflect.has(result, 'error')) {
      const error = hydrateError(result.error);
      if (error) throw error;
    }
    return onHydrateResponse == null ? result : onHydrateResponse(result, { name, type });
  };
}

export function createController({ methods, name: controllerName, ...props }: ControllerProps & ControllerMetadata) {
  return methods
    .reduce((proxy, { name, type }) => ({
      ...proxy,
      [name]: createFunctionFor({ ...props, controllerName, name, type }),
    }), {});
}