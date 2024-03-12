import { AnyObject, Record } from '@anupheaus/common';
import { ControllerMetadata } from '../common';
import { ControllerProps } from './ClientModels';
import { createController } from './ClientController';
import { useCreateStoreController } from './ClientStoreController';
import { useMemo } from 'react';

interface CreateProxyOfProps extends ControllerProps, ControllerMetadata {
  createStoreController(...args: unknown[]): AnyObject;
}

function createProxyOf({ createStoreController, ...props }: CreateProxyOfProps): AnyObject {
  let controllerProxy = createController(props);
  if (props.isStore) {
    const storeControllerProxy = createStoreController(props);
    controllerProxy = { ...controllerProxy, ...storeControllerProxy };
  }
  return controllerProxy;
}

interface Props extends ControllerProps {
  onHydrateRecord?<T extends Record>(record: T, storeName: string): T;
}

export function useCreateControllers(props: Props) {
  const { metadata } = props;
  const createStoreController = useCreateStoreController(props);
  return useMemo(() => new Map(metadata.map(({ name, methods, isStore }) => [name, createProxyOf({ methods, isStore, name, ...props, createStoreController })])), [metadata]);
}
