export interface SocketAPISubscription<Name extends string, Request, Response> {
  name: Name;
  requestType?: Request;
  responseType?: Response;
}

export function defineSubscription<Request, Response>() {
  return <Name extends string>(name: Name): SocketAPISubscription<Name, Request, Response> => ({
    name,
  });
}
