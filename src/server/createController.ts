import { Function } from 'ts-toolbelt';
import { Controller, ControllerAnyFunction, ControllerConfig, ControllerState } from './ControllerModels';

type CreateController<S extends ControllerState, C extends ControllerConfig<S, ControllerAnyFunction>> = Controller<S, ReturnType<C['functions']>>;

export function createController<S extends ControllerState = ControllerState>() {
  return function <C extends ControllerConfig<S, ControllerAnyFunction>>(config: Function.Narrow<C>): CreateController<S, C> {
    return config as CreateController<S, C>;
  };
}

// /**** EXAMPLE ****/

// interface BookStoreState extends ControllerState {
//   store?: string;
// }

// const bookStoreState = createControllerState<BookStoreState>({ user: undefined, store: undefined });

// export const bookStore = createController<BookStoreState>()({
//   name: 'books',
//   functions: ({ state, createAction, createEffect, createQuery, createEvent }) => {
//     const functions = {

//       getAllBooks: createQuery((): Book[] => {
//         return [];
//       }),

//       get: createQuery((id: string) => {
//         return { id, title: 'The Hobbit', author: 'J.R.R. Tolkien' };
//       }),

//       onAdded: createEvent((book: Book) => {
//         if (state.store==null) return;
//         return book;
//       }),

//       sellBook: createEffect((book: Book): boolean => true),

//       /** Inform the author of the sale */
//       informAuthorOfSale: createAction((book: Book): void => {
//         return;
//       }),

//     };

//     return functions;
//   },
// });

// const { get } = useController('books');
