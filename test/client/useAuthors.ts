import { useController } from './useController';

export function useAuthors() {
  const { useRequest } = useController('authors');
  const { data: authors, isLoading } = useRequest();
  return {
    authors,
    isLoading,
  };
}