import { ConstructorOf } from '@anupheaus/common';
import { ClientController, SocketAPIError } from '../common';
import { ServerControllerContext, ServerControllerRequest } from './ServerModels';
import { getContext } from './context';

interface ConfigureProps<ControllerType extends ConstructorOf<Controller>, Name extends string> {
  name: Name;
  exposeToClient?: readonly (keyof InstanceType<ControllerType>)[];
}

export class Controller<ContextType extends ServerControllerContext = ServerControllerContext> {

  public static configure<ControllerType extends ConstructorOf<Controller>, Name extends string, PropsType extends ConfigureProps<ControllerType, Name>>(controller: ControllerType, props: PropsType) {
    const exposedMembers = (props.exposeToClient ?? []);
    const anyController = controller as ClientController<ControllerType, PropsType['exposeToClient'], PropsType['name']>;
    anyController.name = props.name;
    anyController.exposedToClient = exposedMembers;
    return anyController;
  }

  protected get request(): ServerControllerRequest {
    const { client } = getContext();
    return {
      IPAddress: client.IPAddress,
      url: client.url,
    };
  }

  protected get context(): ContextType { return getContext().controllerContext as ContextType; }

  protected useController<ControllerType extends Controller>(controllerName: string): ControllerType {
    const { server } = getContext();
    const controller = server.getController<ControllerType>(controllerName);
    if (!controller) throw new SocketAPIError({ message: `Controller "${controllerName}" not found` });
    return controller;
  }

}
