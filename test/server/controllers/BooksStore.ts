import { createController } from '../../../src/server';
import type { Book } from '../../common';

export const BooksStore = createController()({
  name: 'books',
  functions({ createQuery, createEvent, createEffect, createAction }) {
    const books: Book[] = [
      { id: 1, title: 'The Hobbit', author: 'J.R.R. Tolkien' },
      { id: 2, title: 'The Lord of the Rings', author: 'J.R.R. Tolkien' },
      { id: 3, title: 'The Silmarillion', author: 'J.R.R. Tolkien' },
      { id: 4, title: 'The Chronicles of Narnia', author: 'C.S. Lewis' },
      { id: 5, title: 'The Lion, the Witch and the Wardrobe', author: 'C.S. Lewis' },
    ];

    return {

      getAllBooks: createQuery(() => books),

      addBook: createEffect((book: Book): void => { books.push(book); }),

      printAllBooks: createAction((): void => { return; }),

      onBookSold: createEvent((book: Book) => book),

    };
  },
});
