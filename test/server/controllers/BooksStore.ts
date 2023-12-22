import { ControllerAction, ControllerEffect, ControllerEvent, ControllerQuery } from '../../../src/server';
import type { Book } from '../../common';
import { toController } from './toController';

export class BooksStore extends toController('books') {
  constructor() {
    super();

    this.#books = [
      { id: '1', title: 'The Hobbit', authorId: '1', price: 9.99 },
      { id: '2', title: 'The Lord of the Rings', authorId: '1', price: 19.99 },
      { id: '3', title: 'The Silmarillion', authorId: '1', price: 14.99 },
      { id: '4', title: 'The Chronicles of Narnia', authorId: '2', price: 29.99 },
      { id: '5', title: 'The Lion, the Witch and the Wardrobe', authorId: '2', price: 9.99 },
    ];
  }

  #books: Book[];

  @ControllerQuery()
  public async getAllBooks() {
    return this.respond.asQuery(this.#books);
  }

  @ControllerEffect()
  public async addBook(book: Book) {
    this.#books.push(book);
    this.onBookSold(book);
    return this.respond.asEffect();
  }

  @ControllerAction()
  public async printAllBooks() {
    return this.respond.asAction();
  }

  @ControllerEvent()
  public async onBookSold(book: Book) {
    // const { informAuthorOfSale } = this.useController('authors');
    // informAuthorOfSale(book.authorId, book.price);
    return this.respond.asEvent(book);
  }

}