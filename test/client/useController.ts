import { createUseController } from '../../src/client';
import type { AuthorsStore, BooksStore } from '../server/controllers';

export const useController = createUseController<[
  typeof BooksStore,
  typeof AuthorsStore,
]>();
