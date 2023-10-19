import { createControllerTypes } from '../../src/common';
import type { BooksStore } from '../server/controllers/BooksStore';

export const controllerTypes = createControllerTypes<[
  typeof BooksStore,
]>();
