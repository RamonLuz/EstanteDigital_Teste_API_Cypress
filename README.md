# Testes da API Estante Digital

Este projeto usa Cypress e JavaScript para conferir se a API responde como esperado. O código foi organizado para facilitar a leitura e ajudar estudantes a entender cada etapa dos testes.

## Antes de começar

Você precisa instalar:

- Node.js 22 ou superior
- npm, que é instalado junto com Node.js
- A API Estante Digital em execução na porta 8080

## 1. Inicie a API

Abra um terminal PowerShell e execute:

```powershell
Set-Location C:\Projeto\EstanteDigital\APIs
.\mvnw.cmd '-Dmaven.test.skip=true' spring-boot:run
```

Deixe esse terminal aberto. A API usa um banco em memória, então os dados são apagados quando ela reinicia.

## 2. Instale e execute os testes

Abra outro terminal PowerShell:

```powershell
Set-Location C:\Projeto\EstanteDigital\Cypress
npm install
npm test
```

Para abrir a interface do Cypress:

```powershell
npm run cy:open
```

## Como ler um teste

Abra `cypress/e2e/api/books.cy.js`. Cada `it(...)` descreve um cenário:

```js
it('cadastra um livro', () => {
  loadPayload('payloads/books/create-book.json').then((book) => {
    booksApi.create(book).then((response) => {
      expect(response.status).to.equal(201)
      expect(response.body.title).to.equal(book.title)
    })
  })
})
```

O fluxo é:

1. `loadPayload` lê os dados do arquivo JSON.
2. `booksApi.create` envia uma requisição `POST /books`.
3. `response` contém a resposta da API.
4. `expect` confere se o status e o título estão corretos.

Os outros métodos em `cypress/support/api/books.api.js` representam as rotas:

| Código | Requisição |
| --- | --- |
| `getAll()` | `GET /books` |
| `getById(id)` | `GET /books/{id}` |
| `create(book)` | `POST /books` |
| `update(id, book)` | `PUT /books/{id}` |
| `delete(id)` | `DELETE /books/{id}` |

As chamadas usam `apiRequest`, em `cypress/support/api/api-request.js`. Esse arquivo configura o JSON, envia a requisição e confere automaticamente se a resposta segue o schema esperado.

## Pastas do projeto

```text
cypress/
├── e2e/api/          # Cenários de teste, separados por endpoint
├── fixtures/
│   ├── payloads/     # Dados enviados à API
│   └── schemas/      # Formato esperado das respostas
└── support/
    ├── api/          # Funções que chamam cada endpoint
    └── test-data.js  # Geração de dados e variações para testes
cypress.config.js     # Configuração do Cypress
```

## Endpoints testados

- Saúde: `GET /health`
- Livros: listar, consultar, cadastrar, atualizar e excluir
- Clientes: listar, consultar, cadastrar, atualizar e excluir
- Funcionários: listar, consultar, cadastrar, atualizar e excluir
- Vendas: listar, consultar e cadastrar

Também há testes para dados inválidos, campos ausentes, IDs inexistentes, duplicidade e venda sem cliente, funcionário ou livro relacionado. Os títulos indicam `@smoke` para os cenários principais e `@regression` para as demais verificações. `npm test` executa todos.

## Configurações opcionais

Por padrão, a API é `http://localhost:8080`. Para usar outro endereço ou configurar um token:

```powershell
$env:API_BASE_URL = "http://localhost:8080"
$env:API_TOKEN = "seu-token"
npm test
```

Não coloque tokens ou outras senhas nos arquivos do projeto.

## Observação sobre CPF

Um dos testes verifica se a API rejeita CPFs com mais de 11 dígitos. Atualmente, a API aceita esses valores, então esse teste pode falhar até que a validação do CPF seja ajustada.
