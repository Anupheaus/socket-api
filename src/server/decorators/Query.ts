import { decoratorsRegistry } from './decoratorsRegistry';

export function Query() {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    decoratorsRegistry.register(descriptor, {
      type: 'query',
    });
  };
}