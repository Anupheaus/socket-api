import { decoratorsRegistry } from './decoratorsRegistry';

export function Subscribable() {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    decoratorsRegistry.register(descriptor, {
      type: 'subscribable',

    });
  };
}