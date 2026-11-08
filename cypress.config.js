const { defineConfig } = require('cypress')
const Ajv = require('ajv')
const addFormats = require('ajv-formats')
const { readdirSync, readFileSync } = require('node:fs')
const path = require('node:path')

const resourceSchemas = {
  books: 'books/book',
  customers: 'customers/customer',
  employees: 'employees/employee',
}

function createSchemaValidator() {
  const ajv = new Ajv({ allErrors: true, strict: true })
  addFormats(ajv)

  // Lê todos os contratos JSON Schema uma única vez para validar as respostas.
  const schemasDirectory = path.resolve(__dirname, 'cypress/fixtures/schemas')
  const registerSchemas = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const filePath = path.join(directory, entry.name)
      if (entry.isDirectory()) {
        registerSchemas(filePath)
      } else if (entry.name.endsWith('.schema.json')) {
        ajv.addSchema(JSON.parse(readFileSync(filePath, 'utf8')))
      }
    }
  }

  registerSchemas(schemasDirectory)
  return ajv
}

function schemaIdForResponse(method, url, status) {
  if (status === 204 || status === 404) {
    return null
  }
  if (status === 400) {
    return 'https://estantedigital.test/schemas/common/api-error.schema.json'
  }
  if (status !== 200 && status !== 201) {
    throw new Error(`Nenhum contrato configurado para ${method} ${url} com status ${status}`)
  }

  const segments = url.split('?')[0].split('/').filter(Boolean)
  if (segments.length < 1 || segments.length > 2) {
    throw new Error(`Nenhum contrato configurado para ${method} ${url} com status ${status}`)
  }

  const [resource, id] = segments
  const collection = id === undefined
  let schemaName = null
  if (resource === 'health' && method === 'GET' && collection && status === 200) {
    schemaName = 'health/health'
  } else if (Object.hasOwn(resourceSchemas, resource)) {
    const schemaResource = resourceSchemas[resource]
    if (method === 'GET' && collection && status === 200) {
      schemaName = `${schemaResource}-list`
    } else if (method === 'GET' && !collection && status === 200) {
      schemaName = schemaResource
    } else if (
      (method === 'POST' && collection && status === 201)
      || (method === 'PUT' && !collection && status === 200)
    ) {
      schemaName = schemaResource
    }
  } else if (resource === 'sales') {
    if (method === 'GET' && collection && status === 200) {
      schemaName = 'sales/sale-list'
    } else if (
      (method === 'GET' && !collection && status === 200)
      || (method === 'POST' && collection && status === 201)
    ) {
      schemaName = 'sales/sale'
    }
  }

  if (!schemaName) {
    throw new Error(`Nenhum contrato configurado para ${method} ${url} com status ${status}`)
  }
  return `https://estantedigital.test/schemas/${schemaName}.schema.json`
}

function validateResponseContract(ajv, response) {
  const schemaId = schemaIdForResponse(response.method.toUpperCase(), response.path, response.status)
  if (schemaId === null) {
    const bodyIsEmpty = response.body === null
      || response.body === undefined
      || (typeof response.body === 'string' && response.body.trim().length === 0)
    if (!bodyIsEmpty) {
      throw new Error(`Esperava resposta sem corpo para HTTP ${response.status}`)
    }
    return null
  }

  const validate = ajv.getSchema(schemaId)
  if (!validate) {
    throw new Error(`Schema de resposta não encontrado: ${schemaId}`)
  }
  if (!validate(response.body)) {
    throw new Error(
      `Contrato inválido para ${response.method} ${response.path} (HTTP ${response.status}): `
      + ajv.errorsText(validate.errors, { separator: '; ' }),
    )
  }
  if (
    response.status === 400
    && typeof response.body === 'object'
    && response.body !== null
    && response.body.status !== response.status
  ) {
    throw new Error(`Status do corpo do erro não corresponde ao HTTP ${response.status}`)
  }
  return null
}

module.exports = defineConfig({
  env: {
    apiToken: process.env.API_TOKEN || '',
  },
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || process.env.API_BASE_URL || 'http://localhost:8080',
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: 'cypress/support/e2e.js',
    setupNodeEvents(on) {
      let ajv
      on('task', {
        validateResponseContract(response) {
          if (!ajv) {
            ajv = createSchemaValidator()
          }
          return validateResponseContract(ajv, response)
        },
      })
    },
  },
  video: false,
  screenshotOnRunFailure: true,
})
