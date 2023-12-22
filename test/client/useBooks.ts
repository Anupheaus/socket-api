import { useController } from './useController';

export function useBooks() {
  const { printAllBooks, getAllBooks, addBook /*, onBookSold*/ } = useController('books');
  // eslint-disable-next-line no-console
  // onBookSold(async book => console.log('book sold', book));
  const { response: books, error, isLoading } = getAllBooks();
  return { books, error, isLoading, addBook, printAllBooks };
}