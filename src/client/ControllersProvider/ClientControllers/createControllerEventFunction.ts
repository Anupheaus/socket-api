// import { ControllerAnyFunction } from '../../../common';
// import { ClientControllerCommonProps } from './ClientControllerModels';

// interface CreateControllerFunctionProps extends ClientControllerCommonProps {
//   controllerName: string;
//   name: string;
//   func: ControllerAnyFunction;
// }

// export function createControllerEventFunc({ controllerName, name, logger, useSocket }: CreateControllerFunctionProps) {
//   return async (delegate: (...args: unknown[]) => void) => {
//     useSocket(socket => {
//       logger.silly(`Subscribing to event "${controllerName}.${name}".`);
//       socket.on(`${controllerName}.${name}`, delegate);
//     });
//   };
// }
