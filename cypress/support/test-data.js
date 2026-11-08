export function createScenarioData() {
  // IDs diferentes evitam que um teste dependa dos dados de outro.
  return {
    unique: String(Math.floor(10_000_000_000 + Math.random() * 89_999_999_999)),
    registration: Math.floor(100_000 + Math.random() * 900_000),
  }
}

export function loadPayload(path, data = createScenarioData()) {
  // Carrega um JSON e substitui valores como ${unique} e ${registration}.
  return cy.fixture(path).then((payload) => replacePlaceholders(payload, data))
}

export function mutateField(payload, field, mutation) {
  // Faz uma cópia antes de alterar os dados originais do fixture.
  const result = structuredClone(payload)
  switch (mutation) {
    case 'null':
      result[field] = null
      break
    case 'missing':
      delete result[field]
      break
    case 'blank':
      result[field] = ''
      break
    case 'whitespace':
      result[field] = '   '
      break
    case 'invalid-cpf':
      result[field] = '123'
      break
    case 'too-long-cpf':
      result[field] = '123456789012'
      break
    case 'invalid-date':
      result[field] = 'not-a-date'
      break
    case 'zero':
      result[field] = 0
      break
    case 'negative':
      result[field] = -1
      break
    case 'empty-array':
      result[field] = []
      break
    case 'wrong-type':
      result[field] = typeof result[field] === 'number' ? 'not-a-number' : 42
      break
    default:
      throw new Error(`Mutação JSON desconhecida: ${mutation}`)
  }
  return result
}

function replacePlaceholders(value, data) {
  if (typeof value === 'string') {
    if (value === '${registration}') {
      return data.registration
    }
    return value
      .replaceAll('${unique}', data.unique)
      .replaceAll('${registration}', String(data.registration))
  }
  if (Array.isArray(value)) {
    return value.map((item) => replacePlaceholders(item, data))
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, replacePlaceholders(item, data)]),
    )
  }
  return value
}
