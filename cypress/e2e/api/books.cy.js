import { apiRequest } from '../../support/api/api-request'
import { booksApi } from '../../support/api/books.api'
import { createScenarioData, loadPayload, mutateField } from '../../support/test-data'

describe('API de livros', () => {
  it('@smoke CT002 - cadastra um livro', () => {
    loadPayload('payloads/books/create-book.json').then((book) => {
      booksApi.create(book).then((response) => {
        expect(response.status).to.equal(201)
        expect(response.body.id).to.be.a('number').and.greaterThan(0)
        expect(response.body.title).to.equal(book.title)
      })
    })
  })

  it('@smoke CT003 - consulta um livro pelo ID', () => {
    loadPayload('payloads/books/create-book.json').then((book) => {
      booksApi.create(book).then((created) => {
        booksApi.getById(created.body.id).then((response) => {
          expect(response.status).to.equal(200)
          expect(response.body.title).to.equal(book.title)
          expect(response.body.author).to.equal(book.author)
        })
      })
    })
  })

  it('@smoke CT004 - lista os livros cadastrados', () => {
    loadPayload('payloads/books/create-book.json').then((book) => {
      booksApi.create(book).then(() => {
        booksApi.getAll().then((response) => {
          expect(response.status).to.equal(200)
          expect(response.body.map((item) => item.title)).to.include(book.title)
        })
      })
    })
  })

  it('@smoke - atualiza um livro e confere os dados salvos', () => {
    const data = createScenarioData()
    loadPayload('payloads/books/create-book.json', data).then((book) => {
      loadPayload('payloads/books/update-book.json', data).then((updatedBook) => {
        booksApi.create(book).then((created) => {
          booksApi.update(created.body.id, updatedBook).then((response) => {
            expect(response.status).to.equal(200)
            expect(response.body.title).to.equal(updatedBook.title)
            booksApi.getById(created.body.id).then((persisted) => {
              expect(persisted.body.author).to.equal(updatedBook.author)
            })
          })
        })
      })
    })
  })

  it('@smoke - exclui um livro', () => {
    loadPayload('payloads/books/create-book.json').then((book) => {
      booksApi.create(book).then((created) => {
        booksApi.delete(created.body.id).then((response) => {
          expect(response.status).to.equal(204)
          booksApi.getById(created.body.id).then((deleted) => {
            expect(deleted.status).to.equal(404)
          })
        })
      })
    })
  })

  it('@regression CT005 - rejeita um livro com preço inválido', () => {
    loadPayload('payloads/books/invalid-book.json').then((book) => {
      apiRequest('POST', '/books', book).then((response) => {
        expect(response.status).to.equal(400)
        expect(response.body.message).to.equal('Required fields were not provided')
      })
    })
  })

  const invalidBookFields = [
    ['title', 'blank'], ['title', 'whitespace'], ['title', 'null'], ['title', 'missing'],
    ['author', 'blank'], ['author', 'whitespace'], ['author', 'null'], ['author', 'missing'],
    ['price', 'zero'], ['price', 'negative'], ['price', 'null'], ['price', 'missing'],
    ['price', 'wrong-type'],
  ]

  for (const [field, mutation] of invalidBookFields) {
    it(`@regression - rejeita o campo ${field} quando está ${mutation}`, () => {
      const data = createScenarioData()
      loadPayload('payloads/books/create-book.json', data).then((book) => {
        apiRequest('POST', '/books', mutateField(book, field, mutation)).then((response) => {
          expect(response.status).to.equal(400)
        })
      })
    })
  }

  it('@regression - rejeita um livro duplicado com mesmo título e autor', () => {
    loadPayload('payloads/books/create-book.json').then((book) => {
      booksApi.create(book).then((created) => {
        expect(created.status).to.equal(201)
        apiRequest('POST', '/books', book).then((duplicate) => {
          expect(duplicate.status).to.equal(400)
          expect(duplicate.body.message).to.equal('Book already exists for this author and title')
        })
      })
    })
  })

  it('@regression - rejeita o cadastro sem corpo na requisição', () => {
    apiRequest('POST', '/books').then((response) => {
      expect(response.status).to.equal(400)
      expect(response.body.message).to.equal('Request body is required')
    })
  })

  it('@regression - não atualiza um livro que não existe', () => {
    loadPayload('payloads/books/update-book.json').then((book) => {
      booksApi.update(0, book).then((response) => {
        expect(response.status).to.equal(404)
      })
    })
  })

  it('@regression - rejeita a atualização sem corpo na requisição', () => {
    apiRequest('PUT', '/books/0').then((response) => {
      expect(response.status).to.equal(400)
      expect(response.body.message).to.equal('Request body is required')
    })
  })

  it('@regression - rejeita a atualização com campo obrigatório inválido', () => {
    loadPayload('payloads/books/create-book.json').then((book) => {
      booksApi.create(book).then((created) => {
        loadPayload('payloads/books/update-book.json').then((updated) => {
          apiRequest(
            'PUT',
            `/books/${created.body.id}`,
            mutateField(updated, 'price', 'null'),
          ).then((response) => {
            expect(response.status).to.equal(400)
          })
        })
      })
    })
  })

  it('@regression - não exclui um livro que não existe', () => {
    booksApi.delete(0).then((response) => {
      expect(response.status).to.equal(404)
    })
  })

  for (const id of [0, 999999999]) {
    it(`@regression - retorna não encontrado para o ID ${id}`, () => {
      booksApi.getById(id).then((response) => {
        expect(response.status).to.equal(404)
      })
    })
  }

  for (const method of ['GET', 'PUT', 'DELETE']) {
    it(`@regression - rejeita um ID de livro não numérico no método ${method}`, () => {
      apiRequest(
        method,
        '/books/invalid',
        method === 'PUT' ? { title: 'Book', author: 'Author', price: 1 } : undefined,
      ).then((response) => {
        expect(response.status).to.equal(400)
        expect(response.body.message).to.equal('ID must be numeric')
      })
    })
  }
})
