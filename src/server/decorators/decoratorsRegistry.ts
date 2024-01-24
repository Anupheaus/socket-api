import 'reflect-metadata';
import { ControllerInstance } from '../../common';
import type { ServerControllerMetadata, ServerControllerMethodMetadata } from '../ServerModels';
import { SocketApiServer } from '../ServerServer';
import { StoreController } from '../createToController';

interface MetadataGeneratorFunctionProps {
  instance: ControllerInstance;
  instanceId: string;
  server: SocketApiServer;
}

type MetadataGeneratorFunction = (props: MetadataGeneratorFunctionProps) => ServerControllerMethodMetadata;

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

  public getMetadataFor(instances: ControllerInstance[], server: SocketApiServer) {
    return new Map(instances.map((instance): [string, ServerControllerMetadata] | undefined => {
      const decorators: Map<PropertyKey, MetadataGeneratorFunction> | undefined = Reflect.getMetadata('controller:decorators', instance);
      const isStore = StoreController.isStore(instance);
      if (decorators == null && !isStore) return;
      const instanceId = Math.uniqueId();
      this.#instanceIds.set(instance, instanceId);
      const methods = new Map(decorators == null ? [] : decorators.map((ignore, generateMetadata): [string, ServerControllerMethodMetadata] => {
        const methodMetadata = generateMetadata({ instance, instanceId, server });
        return [methodMetadata.name, methodMetadata];
      }));
      return [instance.name, {
        name: instance.name,
        isStore,
        methods,
      }];
    }).removeNull());
  }
}

export const decoratorsRegistry = new DecoratorsRegistry();