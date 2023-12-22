import { SocketAPIError } from './SocketAPIError';

type ErrorProps = ConstructorParameters<typeof SocketAPIError>[0];

interface Props extends ErrorProps {
  controllerName: string;
}

export class ControllerError extends SocketAPIError {
  constructor({ controllerName, ...props }: Props) {
    super({
      statusCode: 500,
      title: 'Controller Error',
      ...props,
      meta: {
        ...props.meta,
        controllerName,
      },
    });
  }
}