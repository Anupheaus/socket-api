import { Record } from '@anupheaus/common';
import type { ControllerMetadata as CommonControllerMetadata, ControllerMethodMetadata as CommonControllerMethodMetadata } from '../common';

export interface ControllerRequest {
  IPAddress: string;
  url: URL;
}

export interface ControllerContext {
  token: string;
}

export interface ControllerMethodMetadata extends CommonControllerMethodMetadata {
  invoke(...args: unknown[]): Promise<unknown>;
}

export interface ControllerMetadata extends Omit<CommonControllerMetadata, 'methods'> {
  methods: Map<string, ControllerMethodMetadata>;
}

export interface StoreControllerUpsertResponse<T extends Record = Record> {
  record: T;
  isNew: boolean;
}
