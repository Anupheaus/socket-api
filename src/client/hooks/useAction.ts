import { useLayoutEffect, useRef, useState } from 'react';
import type { SocketAPIAction } from '../../common';
import { useSocket } from '../providers';
import { Error, is } from '@anupheaus/common';
import { actionPrefix } from '../../common/internalModels';

function a<Request, Response>(request: Request, response: (response: Response) => void): void;
function a<Request, Response>(request: Request): Promise<Response>;
function a<Request, Response>(_request: Request, _response?: (response: Response) => void): void | Promise<Response> {
  return;
}

function getErrorFromResponse<T>(response: T): { error: Error | undefined; response: T | undefined; } {
  if (is.plainObject(response) && 'error' in response) {
    return { error: new Error(response.error), response: undefined };
  }
  return { error: undefined, response };
}

function checkForError<T>(response: T): T {
  const { error, response: responseWithoutError } = getErrorFromResponse(response);
  if (error) throw error;
  return responseWithoutError as T;
}

export type UseAction<Name extends string, Request, Response> =
  { isConnected(): boolean; }
  & { [P in Name]: typeof a<Request, Response>; }
  & { [P in `use${Capitalize<Name>}`]: (request: Request) => { response: Response | undefined; error: Error | undefined; isLoading: boolean; }; };

// eslint-disable-next-line max-len
export type GetUseActionType<ActionType extends SocketAPIAction<any, any, any>> = ActionType extends SocketAPIAction<infer Name, infer Request, infer Response> ? UseAction<Name, Request, Response>[Name] : never;

export function useAction<Name extends string, Request, Response>(action: SocketAPIAction<Name, Request, Response>): UseAction<Name, Request, Response> {
  const { getIsConnected, emit } = useSocket();
  return {
    [action.name]: async (request: Request, response?: (response: Response) => void) => {
      if (typeof (response) === 'function') {
        emit<Response, Request>(`${actionPrefix}.${action.name.toString()}`, request).then(res => response(checkForError(res)));
      } else {
        return emit<Response, Request>(`${actionPrefix}.${action.name.toString()}`, request).then(checkForError);
      }
    },
    [`use${action.name.toString()}`]: (request: Request) => {
      const [state, setState] = useState<{ response: Response | undefined; error: Error | undefined; isLoading: boolean; }>({ response: undefined, error: undefined, isLoading: true });
      const isMonitoringErrorRef = useRef(false);

      useLayoutEffect(() => {
        setState({ response: undefined, error: undefined, isLoading: true });
        (async () => {
          try {
            const { response, error } = getErrorFromResponse(await emit<Response, Request>(`${actionPrefix}.${action.name.toString()}`, request));
            setState({ response, error, isLoading: false });
          } catch (error) {
            if (isMonitoringErrorRef.current) {
              setState({ response: undefined, error: new Error({ error }), isLoading: false });
            } else {
              throw error;
            }
          }
        })();
      }, []);

      return {
        ...state,
        get error() {
          isMonitoringErrorRef.current = true;
          return state.error;
        },
      };
    },
    isConnected: getIsConnected,
  } as UseAction<Name, Request, Response>;
}