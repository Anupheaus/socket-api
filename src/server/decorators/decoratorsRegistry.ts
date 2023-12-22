import 'reflect-metadata';
import { ControllerInstance } from '../../common';
import type { ServerControllerMetadata, ServerControllerMetadataMap } from '../ServerControllerModels';
import { SocketApiServer } from '../SocketApiServer';

interface MetadataGeneratorFunctionProps {
  instance: ControllerInstance;
  instanceId: string;
  server: SocketApiServer;
}

type MetadataGeneratorFunction = (props: MetadataGeneratorFunctionProps) => ServerControllerMetadata;

class DecoratorsRegistry {
  constructor() {
    this.#instanceIds = new WeakMap();
  }

  #instanceIds: WeakMap<ControllerInstance, string>;

  public register(target: any, propertyKey: PropertyKey, generateMetadata: MetadataGeneratorFunction): void {
    const decorators: Map<PropertyKey, MetadataGeneratorFunction> = Reflect.getMetadata('controller:decorators', target) ?? new Map<PropertyKey, MetadataGeneratorFunction>();
    decorators.set(propertyKey, generateMetadata);
    Reflect.defineMetadata('controller:decorators', decorators, target);
  }

  public get(target: any): MetadataGeneratorFunction[] | undefined {
    const decorators = Reflect.getMetadata('controller:decorators', target);
    if (!decorators) return undefined;
    return Array.from(decorators.values());
  }

  public has(target: any): boolean {
    return Reflect.getMetadata('controller:decorators', target) != null;
  }

  public getMetadataFor(instances: ControllerInstance[], server: SocketApiServer): ServerControllerMetadataMap {
    const metadata = instances.map(instance => {
      const decorators: Map<PropertyKey, MetadataGeneratorFunction> | undefined = Reflect.getMetadata('controller:decorators', instance);
      if (!decorators) return [];
      const instanceId = Math.uniqueId();
      this.#instanceIds.set(instance, instanceId);
      return decorators.map((ignore, generateMetadata) => generateMetadata({ instance, instanceId, server }));
    }).flatten().removeNull();
    return new Map(metadata.map(item => [`${item.name}.${item.methodName}`, item] as const));
  }
}

export const decoratorsRegistry = new DecoratorsRegistry();