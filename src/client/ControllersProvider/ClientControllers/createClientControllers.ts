import { AnyObject } from '@anupheaus/common';
import { ClientControllerCommonProps, CreateControllerFunctionProps } from './ClientControllerModels';
import { createControllerQueryFunc } from './createClientControllerQuery';
import { ControllerMetadata } from '../../../common';
import { createControllerEffectFunc } from './createClientControllerEffect';
import { createControllerActionFunc } from './createClientControllerAction';
import { QueryManager } from './QueryManager';

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
  metadata: ControllerMetadata[];
  queryManager: QueryManager;
}

function createProxyOf({ metadata, ...props }: CreateProxyOfProps) {
  return metadata.reduce((proxy, { name: controllerName, methodName, type: methodType }) => ({
    ...proxy,
    [methodName]: createFunctionFor({ ...props, controllerName, methodName, methodType }),
  }), {});
}

interface CreateControllersProps extends ClientControllerCommonProps {
  metadata: ControllerMetadata[];
}

export function createControllers({ metadata, ...props }: CreateControllersProps): Map<string, AnyObject> {
  const controllers = new Map<string, ControllerMetadata[]>();
  const queryManager = new QueryManager({ logger: props.logger, getSocket: props.getSocket });
  metadata.forEach(innerMetadata => controllers.set(innerMetadata.name, [...(controllers.get(innerMetadata.name) ?? []), innerMetadata]));
  return new Map(Array.from(controllers.entries()).map(([controllerName, innerMetadata]) => [controllerName, createProxyOf({ ...props, queryManager, controllerName, metadata: innerMetadata })]));
}
