import { apiRequest } from './api-request'

// Chamadas HTTP para criar, consultar, atualizar e remover clientes.
export const customersApi = {
  getAll() {
    return apiRequest('GET', '/customers')
  },

  getById(id) {
    return apiRequest('GET', `/customers/${id}`)
  },

  create(customer) {
    return apiRequest('POST', '/customers', customer)
  },

  update(id, customer) {
    return apiRequest('PUT', `/customers/${id}`, customer)
  },

  delete(id) {
    return apiRequest('DELETE', `/customers/${id}`)
  },
}
