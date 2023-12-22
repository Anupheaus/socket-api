import { AnyObject, Error } from '@anupheaus/common';

type ErrorProps = ConstructorParameters<typeof Error>[0];

interface Props extends ErrorProps { }

export class SocketAPIError extends Error {
  constructor(props: Props) {
    super({
      statusCode: 500,
      title: 'Socket Api Error',
      ...props,
    });
  }

  public static from(error: AnyObject): SocketAPIError {
    if (error instanceof SocketAPIError) return error;
    if (error instanceof Error) return new SocketAPIError({ error });
    if (error != null) {
      const message = error?.message ?? 'Unknown Error';
      return new SocketAPIError({ message });
    }
    return new SocketAPIError({ message: 'Unknown Error' });
  }
}