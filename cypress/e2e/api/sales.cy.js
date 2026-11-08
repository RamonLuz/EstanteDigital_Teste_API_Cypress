import { apiRequest } from '../../support/api/api-request'
import { booksApi } from '../../support/api/books.api'
import { customersApi } from '../../support/api/customers.api'
import { employeesApi } from '../../support/api/employees.api'
import { salesApi } from '../../support/api/sales.api'
import { createScenarioData, loadPayload, mutateField } from '../../support/test-data'

function createBook(data) {
  return loadPayload('payloads/sales/create-sale-book.json', data)
    .then((payload) => booksApi.create(payload))
    .then((response) => {
      expect(response.status).to.equal(201)
      return response.body
    })
}

function createCustomer(data) {
  return loadPayload('payloads/sales/create-sale-customer.json', data)
    .then((payload) => customersApi.create(payload))
    .then((response) => {
      expect(response.status).to.equal(201)
      return response.body
    })
}

function createEmployee(data) {
  return loadPayload('payloads/sales/create-sale-employee.json', data)
    .then((payload) => employeesApi.create(payload))
    .then((response) => {
      expect(response.status).to.equal(201)
      return response.body
    })
}

function createPrerequisites(data) {
  return createBook(data).then((book) =>
    createCustomer(data).then((customer) =>
      createEmployee(data).then((employee) => ({ book, customer, employee })),
    ),
  )
}

function createPrerequisitesExcept(data, missingResource) {
  if (missingResource === 'customer') {
    return createBook(data).then(() => createEmployee(data)).then(() => null)
  }
  if (missingResource === 'employee') {
    return createBook(data).then(() => createCustomer(data)).then(() => null)
  }
  return createCustomer(data).then(() => createEmployee(data)).then(() => null)
}

describe('API de vendas', () => {
  it('@smoke CT011 - registra uma venda com recursos cadastrados', () => {
    const data = createScenarioData()
    createPrerequisites(data).then(({ book, customer, employee }) => {
      loadPayload('payloads/sales/create-sale.json', data).then((sale) => {
        salesApi.create(sale).then((response) => {
          expect(response.status).to.equal(201)
          expect(response.body.id).to.be.a('number').and.greaterThan(0)
          expect(response.body.customer.cpf).to.equal(customer.cpf)
          expect(response.body.employee.registrationNumber).to.equal(employee.registrationNumber)
          expect(response.body.book.title).to.equal(book.title)

          salesApi.getById(response.body.id).then((byId) => {
            expect(byId.status).to.equal(200)
            expect(byId.body.book.title).to.equal(book.title)
          })
          salesApi.getAll().then((list) => {
            expect(list.status).to.equal(200)
            expect(list.body.some((item) => item.id === response.body.id)).to.equal(true)
          })
          customersApi.getById(customer.id).then((updatedCustomer) => {
            expect(updatedCustomer.body.purchases).to.be.an('array')
            expect(updatedCustomer.body.purchases.some((purchase) => purchase.id === book.id))
              .to.equal(true)
          })
        })
      })
    })
  })

  const invalidSaleFields = [
    ['customerCpf', 'blank'], ['customerCpf', 'invalid-cpf'],
    ['customerCpf', 'null'], ['customerCpf', 'missing'],
    ['employeeRegistrationNumber', 'zero'], ['employeeRegistrationNumber', 'null'],
    ['employeeRegistrationNumber', 'missing'], ['employeeRegistrationNumber', 'wrong-type'],
    ['bookTitle', 'blank'], ['bookTitle', 'null'], ['bookTitle', 'missing'],
    ['bookAuthor', 'blank'], ['bookAuthor', 'null'], ['bookAuthor', 'missing'],
    ['saleDate', 'invalid-date'], ['saleDate', 'null'], ['saleDate', 'missing'],
  ]

  for (const [field, mutation] of invalidSaleFields) {
    it(`@regression - rejeita o campo ${field} da venda quando está ${mutation}`, () => {
      const data = createScenarioData()
      loadPayload('payloads/sales/create-sale.json', data).then((sale) => {
        apiRequest('POST', '/sales', mutateField(sale, field, mutation)).then((response) => {
          expect(response.status).to.equal(400)
        })
      })
    })
  }

  it('@regression - rejeita o cadastro da venda sem corpo na requisição', () => {
    apiRequest('POST', '/sales').then((response) => {
      expect(response.status).to.equal(400)
      expect(response.body.message).to.equal('Request body is required')
    })
  })

  const missingAssociations = [
    ['customer', 'Customer does not exist'],
    ['employee', 'Employee does not exist'],
    ['book', 'Book does not exist'],
  ]

  for (const [missingResource, message] of missingAssociations) {
    it(`@regression - rejeita a venda quando ${missingResource} não existe`, () => {
      const data = createScenarioData()
      createPrerequisitesExcept(data, missingResource).then(() => {
        loadPayload('payloads/sales/create-sale.json', data).then((sale) => {
          apiRequest('POST', '/sales', sale).then((response) => {
            expect(response.status).to.equal(400)
            expect(response.body.message).to.equal(message)
          })
        })
      })
    })
  }

  for (const id of [0, 999999999]) {
    it(`@regression - retorna não encontrado para o ID de venda ${id}`, () => {
      salesApi.getById(id).then((response) => {
        expect(response.status).to.equal(404)
      })
    })
  }

  it('@regression - rejeita um ID de venda não numérico', () => {
    apiRequest('GET', '/sales/invalid').then((response) => {
      expect(response.status).to.equal(400)
      expect(response.body.message).to.equal('ID must be numeric')
    })
  })
})
