import { apiRequest } from './api-request'

// Este arquivo reúne as chamadas HTTP da rota /books.
export const booksApi = {
  // GET /books: busca todos os livros.
  getAll() {
    return apiRequest('GET', '/books')
  },

  // GET /books/{id}: busca um livro pelo ID.
  getById(id) {
    return apiRequest('GET', `/books/${id}`)
  },

  // POST /books: cria um livro com os dados recebidos.
  create(book) {
    return apiRequest('POST', '/books', book)
  },

  // PUT /books/{id}: atualiza o livro indicado.
  update(id, book) {
    return apiRequest('PUT', `/books/${id}`, book)
  },

  // DELETE /books/{id}: remove o livro indicado.
  delete(id) {
    return apiRequest('DELETE', `/books/${id}`)
  },
}
