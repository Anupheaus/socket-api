import { decoratorsRegistry } from './decoratorsRegistry';

export function Executable() {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    decoratorsRegistry.register(descriptor, {
      type: 'executable',

    });
  };
}