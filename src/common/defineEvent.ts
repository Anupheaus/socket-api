export interface SocketAPIEvent<T> {
  name: string;
  argsType?: T;
}

export function defineEvent<T>(name: string): SocketAPIEvent<T> {
  return {
    name,
  };
}
