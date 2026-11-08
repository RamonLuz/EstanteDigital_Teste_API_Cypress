import { apiRequest } from '../../support/api/api-request'
import { employeesApi } from '../../support/api/employees.api'
import { createScenarioData, loadPayload, mutateField } from '../../support/test-data'

describe('API de funcionários', () => {
  it('@smoke CT009 - cadastra um funcionário', () => {
    loadPayload('payloads/employees/create-employee.json').then((employee) => {
      employeesApi.create(employee).then((response) => {
        expect(response.status).to.equal(201)
        expect(response.body.id).to.be.a('number').and.greaterThan(0)
        expect(response.body.registrationNumber).to.equal(employee.registrationNumber)
      })
    })
  })

  it('@smoke - consulta um funcionário pelo ID', () => {
    loadPayload('payloads/employees/create-employee.json').then((employee) => {
      employeesApi.create(employee).then((created) => {
        employeesApi.getById(created.body.id).then((response) => {
          expect(response.status).to.equal(200)
          expect(response.body.registrationNumber).to.equal(employee.registrationNumber)
        })
      })
    })
  })

  it('@smoke - lista os funcionários cadastrados', () => {
    loadPayload('payloads/employees/create-employee.json').then((employee) => {
      employeesApi.create(employee).then((created) => {
        employeesApi.getAll().then((response) => {
          expect(response.status).to.equal(200)
          expect(response.body.some((item) => item.id === created.body.id)).to.equal(true)
        })
      })
    })
  })

  it('@smoke CT010 - atualiza o status de um funcionário', () => {
    const data = createScenarioData()
    loadPayload('payloads/employees/create-employee.json', data).then((employee) => {
      loadPayload('payloads/employees/update-employee.json', data).then((updated) => {
        employeesApi.create(employee).then((created) => {
          employeesApi.update(created.body.id, updated).then((response) => {
            expect(response.status).to.equal(200)
            expect(response.body.status).to.equal('INACTIVE')
            expect(response.body.name).to.equal(employee.name)
          })
        })
      })
    })
  })

  it('@smoke - exclui um funcionário', () => {
    loadPayload('payloads/employees/create-employee.json').then((employee) => {
      employeesApi.create(employee).then((created) => {
        employeesApi.delete(created.body.id).then((response) => {
          expect(response.status).to.equal(204)
          employeesApi.getById(created.body.id).then((deleted) => {
            expect(deleted.status).to.equal(404)
          })
        })
      })
    })
  })

  const invalidEmployeeFields = [
    ['name', 'blank'], ['name', 'whitespace'], ['name', 'null'], ['name', 'missing'],
    ['cpf', 'invalid-cpf'], ['cpf', 'too-long-cpf'], ['cpf', 'null'], ['cpf', 'missing'],
    ['registrationNumber', 'zero'], ['registrationNumber', 'null'],
    ['registrationNumber', 'missing'], ['registrationNumber', 'wrong-type'],
    ['position', 'blank'], ['position', 'whitespace'], ['position', 'null'], ['position', 'missing'],
    ['status', 'blank'], ['status', 'whitespace'], ['status', 'null'], ['status', 'missing'],
  ]

  for (const [field, mutation] of invalidEmployeeFields) {
    it(`@regression - rejeita o campo ${field} quando está ${mutation}`, () => {
      const data = createScenarioData()
      loadPayload('payloads/employees/create-employee.json', data).then((employee) => {
        apiRequest('POST', '/employees', mutateField(employee, field, mutation)).then((response) => {
          expect(response.status).to.equal(400)
        })
      })
    })
  }

  it('@regression - rejeita o cadastro sem corpo na requisição', () => {
    apiRequest('POST', '/employees').then((response) => {
      expect(response.status).to.equal(400)
      expect(response.body.message).to.equal('Request body is required')
    })
  })

  it('@regression - não atualiza um funcionário que não existe', () => {
    loadPayload('payloads/employees/update-employee.json').then((employee) => {
      employeesApi.update(0, employee).then((response) => {
        expect(response.status).to.equal(404)
      })
    })
  })

  it('@regression - rejeita a atualização sem corpo na requisição', () => {
    apiRequest('PUT', '/employees/0').then((response) => {
      expect(response.status).to.equal(400)
      expect(response.body.message).to.equal('Request body is required')
    })
  })

  it('@regression - rejeita a atualização com status inválido', () => {
    loadPayload('payloads/employees/create-employee.json').then((employee) => {
      employeesApi.create(employee).then((created) => {
        loadPayload('payloads/employees/update-employee.json').then((updated) => {
          apiRequest(
            'PUT',
            `/employees/${created.body.id}`,
            mutateField(updated, 'status', 'blank'),
          ).then((response) => {
            expect(response.status).to.equal(400)
          })
        })
      })
    })
  })

  it('@regression - não exclui um funcionário que não existe', () => {
    employeesApi.delete(0).then((response) => {
      expect(response.status).to.equal(404)
    })
  })

  for (const id of [0, 999999999]) {
    it(`@regression - retorna não encontrado para o ID ${id}`, () => {
      employeesApi.getById(id).then((response) => {
        expect(response.status).to.equal(404)
      })
    })
  }

  for (const method of ['GET', 'PUT', 'DELETE']) {
    it(`@regression - rejeita um ID de funcionário não numérico no método ${method}`, () => {
      apiRequest(
        method,
        '/employees/invalid',
        method === 'PUT'
          ? {
              name: 'Employee',
              cpf: '12345678901',
              registrationNumber: 1,
              position: 'Seller',
              status: 'ACTIVE',
            }
          : undefined,
      ).then((response) => {
        expect(response.status).to.equal(400)
        expect(response.body.message).to.equal('ID must be numeric')
      })
    })
  }
})
