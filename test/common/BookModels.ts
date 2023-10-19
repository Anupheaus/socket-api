import { createSocketControllerLink } from '../../src/common';
import type { BooksStore as BookStoreType } from '../server/controllers/BooksStore';

export interface Book {
  id: number;
  title: string;
  author: string;
}

export const BooksStoreLink = 'BooksStore';

export const BooksStore = createSocketControllerLink<BookStoreType>(BooksStoreLink);
