import type { Controller } from '../server';
import { ConstructorOf, Record } from '@anupheaus/common';

export interface ControllerMethodMetadata {
  name: string;
  type: 'query' | 'event' | 'effect' | 'action';
}

export interface ControllerMetadata {
  name: string;
  isStore: boolean;
  methods: ControllerMethodMetadata[];
}

export type ClientController<ControllerType extends ConstructorOf<Controller> = ConstructorOf<Controller>, ExposedMembers extends readonly PropertyKey[] | undefined = undefined,
  Name extends string = string> = ControllerType & {
    name: Name;
    exposedToClient: ExposedMembers;
    addExposedMembers?(): string[];
  };

export type StoreControllerUpdate<T extends Record = Record> = {
  action: 'update' | 'create';
  record: T;
} | {
  action: 'remove';
  record: string;
} | {
  action: 'push';
  records: T[];
};
