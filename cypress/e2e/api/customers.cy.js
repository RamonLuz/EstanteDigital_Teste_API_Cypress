import { apiRequest } from '../../support/api/api-request'
import { customersApi } from '../../support/api/customers.api'
import { createScenarioData, loadPayload, mutateField } from '../../support/test-data'

describe('API de clientes', () => {
  it('@smoke CT006 - cadastra um cliente', () => {
    loadPayload('payloads/customers/create-customer.json').then((customer) => {
      customersApi.create(customer).then((response) => {
        expect(response.status).to.equal(201)
        expect(response.body.id).to.be.a('number').and.greaterThan(0)
        expect(response.body.cpf).to.equal(customer.cpf)
      })
    })
  })

  it('@smoke CT007 - consulta um cliente pelo ID', () => {
    loadPayload('payloads/customers/create-customer.json').then((customer) => {
      customersApi.create(customer).then((created) => {
        customersApi.getById(created.body.id).then((response) => {
          expect(response.status).to.equal(200)
          expect(response.body.cpf).to.equal(customer.cpf)
          expect(response.body.status).to.equal('ACTIVE')
        })
      })
    })
  })

  it('@smoke - lista os clientes cadastrados', () => {
    loadPayload('payloads/customers/create-customer.json').then((customer) => {
      customersApi.create(customer).then((created) => {
        customersApi.getAll().then((response) => {
          expect(response.status).to.equal(200)
          expect(response.body.some((item) => item.id === created.body.id)).to.equal(true)
        })
      })
    })
  })

  it('@smoke - atualiza o status de um cliente', () => {
    const data = createScenarioData()
    loadPayload('payloads/customers/create-customer.json', data).then((customer) => {
      loadPayload('payloads/customers/update-customer.json', data).then((updated) => {
        customersApi.create(customer).then((created) => {
          customersApi.update(created.body.id, updated).then((response) => {
            expect(response.status).to.equal(200)
            expect(response.body.status).to.equal('INACTIVE')
            customersApi.getById(created.body.id).then((persisted) => {
              expect(persisted.body.status).to.equal('INACTIVE')
            })
          })
        })
      })
    })
  })

  it('@smoke - exclui um cliente', () => {
    loadPayload('payloads/customers/create-customer.json').then((customer) => {
      customersApi.create(customer).then((created) => {
        customersApi.delete(created.body.id).then((response) => {
          expect(response.status).to.equal(204)
          customersApi.getById(created.body.id).then((deleted) => {
            expect(deleted.status).to.equal(404)
          })
        })
      })
    })
  })

  it('@regression CT008 - rejeita um CPF inválido', () => {
    loadPayload('payloads/customers/invalid-customer.json').then((customer) => {
      apiRequest('POST', '/customers', customer).then((response) => {
        expect(response.status).to.equal(400)
        expect(response.body.message).to.equal('CPF must have 11 digits')
      })
    })
  })

  const invalidCustomerFields = [
    ['name', 'blank'], ['name', 'whitespace'], ['name', 'null'], ['name', 'missing'],
    ['cpf', 'invalid-cpf'], ['cpf', 'too-long-cpf'], ['cpf', 'null'], ['cpf', 'missing'],
    ['status', 'blank'], ['status', 'whitespace'], ['status', 'null'], ['status', 'missing'],
  ]

  for (const [field, mutation] of invalidCustomerFields) {
    it(`@regression - rejeita o campo ${field} quando está ${mutation}`, () => {
      const data = createScenarioData()
      loadPayload('payloads/customers/create-customer.json', data).then((customer) => {
        apiRequest('POST', '/customers', mutateField(customer, field, mutation)).then((response) => {
          expect(response.status).to.equal(400)
        })
      })
    })
  }

  const optionalPurchaseCases = [
    ['empty array', 'empty-array'],
    ['null', 'null'],
    ['omitted', 'missing'],
  ]

  for (const [description, mutation] of optionalPurchaseCases) {
    it(`@regression - aceita compras opcionais como ${description}`, () => {
      const data = createScenarioData()
      loadPayload('payloads/customers/create-customer-with-purchases.json', data).then((customer) => {
        customersApi.create(mutateField(customer, 'purchases', mutation)).then((response) => {
          expect(response.status).to.equal(201)
        })
      })
    })
  }

  it('@regression - rejeita compras com tipo de dado inválido', () => {
    const data = createScenarioData()
    loadPayload('payloads/customers/create-customer-with-purchases.json', data).then((customer) => {
      apiRequest(
        'POST',
        '/customers',
        mutateField(customer, 'purchases', 'wrong-type'),
      ).then((response) => {
        expect(response.status).to.equal(400)
      })
    })
  })

  it('@regression - rejeita o cadastro de um CPF já utilizado', () => {
    loadPayload('payloads/customers/create-customer.json').then((customer) => {
      customersApi.create(customer).then((created) => {
        expect(created.status).to.equal(201)
        apiRequest('POST', '/customers', customer).then((duplicate) => {
          expect(duplicate.status).to.equal(400)
          expect(duplicate.body.message).to.equal('CPF already registered')
        })
      })
    })
  })

  it('@regression - rejeita o cadastro sem corpo na requisição', () => {
    apiRequest('POST', '/customers').then((response) => {
      expect(response.status).to.equal(400)
      expect(response.body.message).to.equal('Request body is required')
    })
  })

  it('@regression - não atualiza um cliente que não existe', () => {
    loadPayload('payloads/customers/update-customer.json').then((customer) => {
      customersApi.update(0, customer).then((response) => {
        expect(response.status).to.equal(404)
      })
    })
  })

  it('@regression - rejeita a atualização sem corpo na requisição', () => {
    apiRequest('PUT', '/customers/0').then((response) => {
      expect(response.status).to.equal(400)
      expect(response.body.message).to.equal('Request body is required')
    })
  })

  it('@regression - rejeita a atualização com status inválido', () => {
    loadPayload('payloads/customers/create-customer.json').then((customer) => {
      customersApi.create(customer).then((created) => {
        loadPayload('payloads/customers/update-customer.json').then((updated) => {
          apiRequest(
            'PUT',
            `/customers/${created.body.id}`,
            mutateField(updated, 'status', 'blank'),
          ).then((response) => {
            expect(response.status).to.equal(400)
          })
        })
      })
    })
  })

  it('@regression - não exclui um cliente que não existe', () => {
    customersApi.delete(0).then((response) => {
      expect(response.status).to.equal(404)
    })
  })

  for (const id of [0, 999999999]) {
    it(`@regression - retorna não encontrado para o ID ${id}`, () => {
      customersApi.getById(id).then((response) => {
        expect(response.status).to.equal(404)
      })
    })
  }

  for (const method of ['GET', 'PUT', 'DELETE']) {
    it(`@regression - rejeita um ID de cliente não numérico no método ${method}`, () => {
      apiRequest(
        method,
        '/customers/invalid',
        method === 'PUT' ? { name: 'Customer', cpf: '12345678901', status: 'ACTIVE' } : undefined,
      ).then((response) => {
        expect(response.status).to.equal(400)
        expect(response.body.message).to.equal('ID must be numeric')
      })
    })
  }
})
