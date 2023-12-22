import { ToControllerTypes } from '../../src/common';
import type { BooksStore, AuthorsStore } from '../server/controllers';

export type ControllerTypes = ToControllerTypes<[
  BooksStore,
  AuthorsStore,
]>;
