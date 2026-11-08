Cypress.Commands.add(
  'validateResponseContract',
  (method, path, status, body) =>
    cy.task(
      'validateResponseContract',
      { method, path, status, body },
      { log: false },
    ),
)
