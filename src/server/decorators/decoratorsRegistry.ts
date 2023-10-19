import { is } from '@anupheaus/common';
import { SocketServerError } from '../../common';
import { Decorator, Decorators } from '../internalSockets';

const DecoratorSymbol = Symbol('SocketDecorator');

class DecoratorsRegistry {

  public register(descriptor: PropertyDescriptor, settings: Decorator): void {
    if (!is.function(descriptor.value)) throw new SocketServerError('Socket Controller Decorator was not applied to a function.');
    const decorators = this.get(descriptor) ?? [];
    descriptor.value[DecoratorSymbol] = decorators;
    decorators.push(settings);
  }

  public get(descriptor: PropertyDescriptor): Decorators | undefined {
    if (!is.function(descriptor.value)) throw new SocketServerError('Socket Controller Decorator was not applied to a function.');
    return descriptor.value[DecoratorSymbol];
  }

  public has(descriptor: PropertyDescriptor): boolean {
    return this.get(descriptor) != null;
  }
}

export const decoratorsRegistry = new DecoratorsRegistry();