import { AnyFunction, Logger } from '@anupheaus/common';
import { ControllerAction, ControllerConfig } from './ControllerModels';

interface Props {
  controller: ControllerConfig;
  logger: Logger;
}

export function createControllerAction({ controller, logger }: Props) {
  return <F extends AnyFunction>(delegate: F): ControllerAction<F> => {
    const func = ((...args: any[]) => logger.wrap('debug', `Executing action ${controller.name}.${delegate.name}(${args.join(', ')})`, () => delegate(...args))) as F;
    return {
      ...func,
      type: 'action',
    };
  };
}
