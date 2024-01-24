import { is } from '@anupheaus/common';
import { decoratorsRegistry } from './decoratorsRegistry';

export function ControllerAction() {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor => {
    if (!is.function(descriptor.value)) throw new Error('ControllerAction decorator can only be applied to a method');
    let func = descriptor.value;
    decoratorsRegistry.register(target, propertyKey, ({ instance }) => {
      func = func.bind(instance);
      return ({
        type: 'action',
        name: propertyKey,
        invoke: ({ args }) => func(...args),
      });
    });
    return {
      ...descriptor,
      value: (...args: unknown[]) => func(...args),
    };
  };
}