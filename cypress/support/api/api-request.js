export function apiRequest(method, url, body) {
  // Todas as chamadas usam JSON e validam a resposta com o contrato da API.
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }
  const token = Cypress.env('apiToken')
  if (typeof token === 'string' && token.length > 0) {
    headers.Authorization = `Bearer ${token}`
  }

  // Não interrompe a execução em respostas de erro: o teste verifica o status esperado.
  return cy.request({
    method,
    url,
    headers,
    body,
    failOnStatusCode: false,
  }).then((response) =>
    cy.validateResponseContract(
      method,
      url,
      response.status,
      response.body,
    ).then(() => response),
  )
}
