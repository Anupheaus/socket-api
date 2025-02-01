export interface SocketAPIAction<Name extends string, Request, Response> { name: Name, requestType?: Request; responseType?: Response; }

export function defineAction<Request, Response>() {
  return <Name extends string>(name: Name): SocketAPIAction<Name, Request, Response> => ({
    name,
  });
}
