import { useBound } from '@anupheaus/react-ui';
import { Book } from '../common';
import { useController } from './useController';

export function useBooks() {
  const { useRequest, upsert } = useController('books');
  const { data: books, isLoading, error } = useRequest();
  const addBook = useBound((book: Book) => upsert(book));
  return { books, error, isLoading, addBook };
}