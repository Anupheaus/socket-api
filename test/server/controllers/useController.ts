import { createUseController } from '../../../src/server/createUseController';
import { BooksStore } from './BooksStore';

export const useController = createUseController()({
  controllers: [BooksStore],
  defaultState: {},
  logger: new Logger(),
});