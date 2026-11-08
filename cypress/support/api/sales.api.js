import { apiRequest } from './api-request'

// Chamadas HTTP disponíveis para vendas: criar e consultar.
export const salesApi = {
  getAll() {
    return apiRequest('GET', '/sales')
  },

  getById(id) {
    return apiRequest('GET', `/sales/${id}`)
  },

  create(sale) {
    return apiRequest('POST', '/sales', sale)
  },
}
