import { useBound } from '@anupheaus/react-ui';
import { Book, BooksStoreAPI } from '../common';

export function useBooks() {
  const { useRequest, upsert } = useController<BooksStoreAPI>('books');
  const { data: books, isLoading, error } = useRequest();
  const addBook = useBound((book: Book) => upsert(book));
  return { books, error, isLoading, addBook };
}