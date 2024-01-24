import { is } from '@anupheaus/common';
import { decoratorsRegistry } from './decoratorsRegistry';

export function ControllerEffect() {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor => {
    if (!is.function(descriptor.value)) throw new Error('ControllerEffect decorator can only be applied to a method');
    let func = descriptor.value;
    decoratorsRegistry.register(target, propertyKey, ({ instance, instanceId, server }) => {
      const originalFunc = descriptor.value;
      func = async (...args: unknown[]) => {
        const result = await originalFunc.call(instance, ...args);
        server.processQueries(instanceId);
        return result;
      };
      return ({
        type: 'effect',
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