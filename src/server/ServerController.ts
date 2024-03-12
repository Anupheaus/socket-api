import { ConstructorOf } from '@anupheaus/common';
import { ClientController, SocketAPIError } from '../common';
import { ControllerContext, ControllerRequest } from './ServerModels';
import { getContext } from './context';
import type { Server } from './ServerServer';

type InstanceType<T> = T extends abstract new (...args: any) => infer R ? R : any;

interface ConfigureProps<ControllerType extends ConstructorOf<Controller>, Name extends string> {
  name: Name;
  exposeToClient?: readonly (keyof InstanceType<ControllerType>)[];
}

export class Controller<ContextType extends ControllerContext = ControllerContext> {

  #parent?: Server;

  public static configure<ControllerType extends ConstructorOf<Controller>, Name extends string, PropsType extends ConfigureProps<ControllerType, Name>>(controller: ControllerType, props: PropsType) {
    const anyController = controller as ClientController<ControllerType, PropsType['exposeToClient'], PropsType['name']>;
    const exposedMembers = [...props.exposeToClient ?? [], ...anyController.addExposedMembers?.() ?? []].distinct() as any;

    Reflect.defineProperty(anyController, 'name', {
      get: () => props.name,
      configurable: true,
      enumerable: true,
    });
    anyController.exposedToClient = exposedMembers;
    return anyController;
  }

  protected static addExposedMembers?(): string[];

  public get name() { return this.constructor.name; }

  protected get request(): ControllerRequest {
    const { client } = getContext();
    return {
      IPAddress: client.IPAddress,
      url: client.url,
    };
  }

  protected emit(eventName: string, payload: unknown) {
    const client = getContext().client;
    client.emit(eventName, payload);
  }

  protected get context(): ContextType { return getContext().context as ContextType; }

  protected useController<ControllerType extends ClientController<any, any>>(controller: ControllerType): InstanceType<ControllerType> {
    const server = this.#parent;
    if (server == null) throw new SocketAPIError({ message: 'Server not set on controller' });
    const typedController = controller as unknown as ClientController;
    const foundController = server.getController(typedController.name);
    if (!foundController) throw new SocketAPIError({ message: `Controller "${typedController.name}" not found` });
    return foundController as InstanceType<ControllerType>;
  }

  private setParent(parent: Server): void {
    this.#parent = parent;
  }

}
