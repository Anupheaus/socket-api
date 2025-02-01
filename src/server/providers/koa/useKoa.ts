import { Context } from '../../contexts';
import type { KoaContextProps } from './koaContexts';

export function useKoa() {
  return Context.get<KoaContextProps>('koa');
}