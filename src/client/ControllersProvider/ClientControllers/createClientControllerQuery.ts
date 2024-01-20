import { useId, useOnUnmount } from '@anupheaus/react-ui';
import { useEffect, useLayoutEffect, useState } from 'react';
import { CreateControllerFunctionProps } from './ClientControllerModels';
import { QueryState } from './QueryManager';

export function createControllerQueryFunc({ controllerName, methodName, queryManager, onDehydrateRequestArgs, onHydrateResponse }: CreateControllerFunctionProps) {
  const eventName = `${controllerName}.${methodName}`;

  return (...args: unknown[]): QueryState => {
    args = onDehydrateRequestArgs(args, { name: controllerName, methodName, type: 'query' });
    const id = useId();
    const [state, setState] = useState<QueryState>({ response: undefined, error: undefined, isLoading: true });
    const isUnmounted = useOnUnmount();
    const hash = Object.hash({ args });

    useLayoutEffect(() => {
      setState(s => ({ ...s, isLoading: true }));

      queryManager.registerQueryHook({
        id,
        hash,
        eventName,
        payload: args,
        stateUpdate: ({ response, isLoading, error }) => {
          if (isUnmounted()) return;
          response = onHydrateResponse(response, { name: controllerName, methodName, type: 'query' });
          setState({ response, isLoading, error });
        },
      });
    }, [hash]);

    useEffect(() => () => {
      queryManager.unregisterQueryHook(id);
    }, []);

    return state;
  };
}
