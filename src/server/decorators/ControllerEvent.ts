import { is } from '@anupheaus/common';
import { decoratorsRegistry } from './decoratorsRegistry';

export function ControllerEvent() {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor => {
    if (!is.function(descriptor.value)) throw new Error('ControllerEvent decorator can only be applied to a method');
    let func = descriptor.value;
    decoratorsRegistry.register(target, propertyKey, ({ instance, server }) => {
      const eventName = `${instance.name}.${propertyKey}`;
      const originalFunc = descriptor.value;
      func = async (...args: unknown[]) => {
        const result = await originalFunc.call(instance, ...args);
        server.emit(eventName, result);
        return result;
      };
      return ({
        type: 'event',
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