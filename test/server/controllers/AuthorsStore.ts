import type { Author } from '../../common';
import { toController } from './toController';

// export const AuthorsStore = createController()({
//   name: 'authors',
//   functions({ createQuery, createEffect, createEvent }) {
//     const authors: Author[] = [
//       { id: '1', name: 'J.R.R. Tolkien', totalSoldValue: 0 },
//       { id: '2', name: 'C.S. Lewis', totalSoldValue: 0 },
//     ];

//     const functions = {

//       getAllAuthors: createQuery(() => authors),

//       addAuthor: createEffect((author: Author): void => { authors.push(author); }),

//       updateTotalSoldValue: createEffect((authorId: string, total: number): void => {
//         const author = authors.findById(authorId);
//         if (author == null) return;
//         author.totalSoldValue += total;
//       }),

//       informAuthorOfSale: createEvent((authorId: string, price: number) => {
//         functions.updateTotalSoldValue(authorId, price);
//         return {
//           author: authors.findById(authorId),
//           price,
//         };
//       }),

//     };
//     return functions;
//   },
// });

export class AuthorsStore extends toController('authors') {
  constructor() {
    super();

    this.#authors = [
      { id: '1', name: 'J.R.R. Tolkien', totalSoldValue: 0 },
      { id: '2', name: 'C.S. Lewis', totalSoldValue: 0 },
    ];
  }

  #authors: Author[];

  public async getAllAuthors() {
    return this.respond.asQuery(this.#authors);
  }

  public async addAuthor(author: Author) {
    this.#authors.push(author);
    return this.respond.asEffect();
  }

  public async updateTotalSoldValue(authorId: string, total: number) {
    const author = this.#authors.findById(authorId);
    if (author == null) return;
    author.totalSoldValue += total;
    return this.respond.asEffect();
  }

  // public async informAuthorOfSale(authorId: string, price: number) {
  //   await this.updateTotalSoldValue(authorId, price);
  //   return this.respond.asEvent({
  //     author: this.#authors.findById(authorId),
  //     price,
  //   });
  // }

}