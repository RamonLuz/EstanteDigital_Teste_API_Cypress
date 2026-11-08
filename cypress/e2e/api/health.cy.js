import { apiRequest } from '../../support/api/api-request'

describe('Saúde da API', () => {
  it('@smoke CT001 - verifica se a aplicação está disponível', () => {
    apiRequest('GET', '/health').then((response) => {
      expect(response.status).to.equal(200)
      expect(response.body).to.deep.equal({
        status: 'UP',
        application: 'estantedigital',
      })
    })
  })
})
