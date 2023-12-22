import { is } from '@anupheaus/common';
import { decoratorsRegistry } from './decoratorsRegistry';

export function ControllerAction() {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor => {
    if (!is.function(descriptor.value)) throw new Error('ControllerAction decorator can only be applied to a method');
    const func = descriptor.value;
    decoratorsRegistry.register(target, propertyKey, ({ instance }) => {
      return ({
        type: 'action',
        name: instance.name,
        methodName: propertyKey,
        invoke: func,
      });
    });
    return func;
  };
}