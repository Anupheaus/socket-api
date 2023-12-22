import { AnyObject, is } from '@anupheaus/common';
import { ControllerQuerySubscription, ControllerQueryUpdate } from '../../common';
import { SocketApiClient } from '../SocketApiClient';
import { decoratorsRegistry } from './decoratorsRegistry';

function validateRequest(request: AnyObject): request is ControllerQuerySubscription {
  if (request == null || is.not.object(request)) throw new Error('Invalid controller query request argument.');
  return Reflect.has(request, 'query') && Reflect.has(request.query, 'hash') && Reflect.has(request.query, 'action');
}

function getLastQueryResult(queryResults: WeakMap<SocketApiClient, Map<string, string>>, client: SocketApiClient, requestId: string): string | undefined {
  const allResults = queryResults.get(client) ?? new Map<string, string>();
  queryResults.set(client, allResults);
  return allResults.get(requestId);
}

function setLastQueryResult(queryResults: WeakMap<SocketApiClient, Map<string, string>>, client: SocketApiClient, requestId: string, resultHash: string) {
  const allResults = queryResults.get(client) ?? new Map<string, string>();
  queryResults.set(client, allResults);
  allResults.set(requestId, resultHash);
}

export function ControllerQuery() {
  const queryResults = new WeakMap<SocketApiClient, Map<string, string>>();
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor => {
    if (!is.function(descriptor.value)) throw new Error('ControllerQuery decorator can only be applied to a method');
    const func = descriptor.value;
    decoratorsRegistry.register(target, propertyKey, ({ instance, instanceId }) => ({
      type: 'query',
      name: instance.name,
      methodName: propertyKey,
      async invoke({ client, args, send }) {
        const request = args[0] as AnyObject;
        if (!validateRequest(request)) return;
        const { query, payload } = request;

        // here we execute the query and if the results are the same as las time 
        const executeQuery = async () => {
          const lastQueryResultHash = getLastQueryResult(queryResults, client, query.hash);
          const results = await func.call(instance, payload);
          const resultHash = Object.hash(results);
          if (lastQueryResultHash != null && resultHash === lastQueryResultHash) return;
          setLastQueryResult(queryResults, client, query.hash, resultHash);
          send({ queryHash: query.hash, results } as ControllerQueryUpdate, eventName => `${eventName}.${query.hash}`);
        };

        if (query.action === 'subscribe') {
          client.registerQueryRequest({
            queryHash: query.hash,
            instanceId,
            invoke: executeQuery,
          });
          await executeQuery();
        } else {
          client.unregisterQueryRequest(instanceId, query.hash);
        }
      },
    }));
    return descriptor;
  };
}