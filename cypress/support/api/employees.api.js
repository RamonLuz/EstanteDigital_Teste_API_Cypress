import { apiRequest } from './api-request'

// Chamadas HTTP para criar, consultar, atualizar e remover funcionários.
export const employeesApi = {
  getAll() {
    return apiRequest('GET', '/employees')
  },

  getById(id) {
    return apiRequest('GET', `/employees/${id}`)
  },

  create(employee) {
    return apiRequest('POST', '/employees', employee)
  },

  update(id, employee) {
    return apiRequest('PUT', `/employees/${id}`, employee)
  },

  delete(id) {
    return apiRequest('DELETE', `/employees/${id}`)
  },
}
