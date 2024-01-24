import { AnyObject } from '@anupheaus/common';
import { ClientControllerCommonProps, CreateControllerFunctionProps } from './ClientControllerModels';
import { createControllerQueryFunc } from './createClientControllerQuery';
import { ControllerMetadata, ControllerMethodMetadata } from '../../../common';
import { createControllerEffectFunc } from './createClientControllerEffect';
import { createControllerActionFunc } from './createClientControllerAction';
import { QueryManager } from './QueryManager';
import { createClientStoreControllerFunctions } from './createClientStoreControllerFunctions';
import { ClientStoreController } from '../createClientStores';

function createFunctionFor(props: CreateControllerFunctionProps) {
  switch (props.methodType) {
    case 'action': return createControllerActionFunc(props);
    // case 'event': return createControllerEventFunc(props);
    case 'query': return createControllerQueryFunc(props);
    case 'effect': return createControllerEffectFunc(props);
  }
}

interface CreateProxyOfProps extends ClientControllerCommonProps {
  controllerName: string;
  methods: ControllerMethodMetadata[];
  queryManager: QueryManager;
  isStore: boolean;
}

function createProxyOf({ methods, isStore, controllerName, ...props }: CreateProxyOfProps) {
  return methods
    .reduce((proxy, { name, type }) => ({
      ...proxy,
      [name]: createFunctionFor({ ...props, controllerName, methodName: name, methodType: type }),
    }), isStore ? createClientStoreControllerFunctions({ ...props, controllerName }) : {});
}

interface CreateControllersProps extends ClientControllerCommonProps {
  metadata: ControllerMetadata[];
}

export function createClientControllers({ metadata, ...props }: CreateControllersProps): Map<string, AnyObject> {
  const queryManager = new QueryManager({ logger: props.logger, getSocket: props.getSocket });
  return new Map(metadata.map(({ name, methods, isStore }) => [name, createProxyOf({ ...props, queryManager, controllerName: name, methods, isStore })]));
}
