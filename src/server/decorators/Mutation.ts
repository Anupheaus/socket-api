import { ConstructorOf } from '@anupheaus/common';
import { SocketController } from '../SocketController';
import { decoratorsRegistry } from './decoratorsRegistry';

interface Props {
  alsoMutates?: ConstructorOf<SocketController>[];
}

export function Mutation({ alsoMutates = [] }: Props = {}) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    decoratorsRegistry.register(descriptor, {
      type: 'mutation',
      alsoMutates: alsoMutates.map(controller => controller.name),
    });
  };
}