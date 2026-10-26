# Optiva CRM — Backend

API REST do Optiva CRM, responsável pela autenticação, regras de negócio e acesso ao PostgreSQL. A aplicação usa Express 5, Knex e sessões autenticadas por cookies HTTP-only.

## Requisitos

- Node.js compatível com as dependências do projeto
- npm
- PostgreSQL local ou serviço PostgreSQL compatível, como Neon

## Instalação e execução local

Na pasta `backend`, instale as dependências e crie seu arquivo de ambiente local:

```bash
npm ci
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

Linux/macOS:

```bash
cp .env.example .env
```

Edite `.env` e informe a conexão do banco em `DATABASE_URL`. Para executar localmente, o padrão é `NODE_ENV=development`, `PORT=3000` e `CORS_ORIGIN=http://localhost:4200`.

Crie as tabelas, carregue os dados de referência e inicie a API:

```bash
npm run db:schema
npm run seed
npm run dev
```

A API ficará em `http://localhost:3000`. O endpoint público `GET /health` retorna o estado e o tempo de atividade do processo.

## Variáveis de ambiente

| Variável | Uso |
| --- | --- |
| `NODE_ENV` | Ambiente (`development` ou `production`). |
| `PORT` | Porta HTTP; padrão `3000`. |
| `DATABASE_URL` | String de conexão PostgreSQL. Obrigatória. |
| `CORS_ORIGIN` | Origem autorizada do frontend; padrão `http://localhost:4200`. |
| `ACCESS_TOKEN_SECRET` | Segredo de assinatura do access token. Em produção, deve ter pelo menos 32 bytes. |
| `JWT_ISSUER` | Emissor do access token; padrão `optiva-api`. |
| `JWT_AUDIENCE` | Audiência do access token; padrão `optiva-web`. |
| `ACCESS_TOKEN_EXPIRES_IN` | Validade do access token; padrão `15m`. |
| `REFRESH_TOKEN_EXPIRES_IN` | Validade da sessão de refresh; padrão `7d`. |

O arquivo `.env.example` contém valores de exemplo. Não use os valores de exemplo nem o segredo de desenvolvimento em produção. Mantenha credenciais reais apenas no `.env` local ou no gerenciador de segredos do ambiente de deploy.

## Scripts npm

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia a API com reinicialização automática via Nodemon. |
| `npm start` | Inicia a API com Node.js. |
| `npm run db:schema` | Aplica `database/schema.sql` usando a conexão configurada. |
| `npm run seed` | Insere dados de referência com `database/seed.js`; pode ser executado novamente sem duplicar os registros existentes. |
| `npm run db:create` | Executa `database/create-tables.sql` pelo cliente `psql`. |
| `npm run db:seed:sql` | Executa `database/seed.sql` pelo cliente `psql`. |
| `npm test` | Executa os testes Node.js configurados em `tests/unit/*.test.js`. |

Os scripts `db:create` e `db:seed:sql` requerem o cliente PostgreSQL `psql` instalado. Para a inicialização habitual do projeto, use `db:schema` e `seed`. O script `npm test` está configurado, mas a pasta `tests/unit` ainda não existe neste projeto.

## API

Os grupos de recursos abaixo passam pelo middleware de autenticação. As rotas de autenticação têm seus próprios fluxos e validações.

| Recurso | Endpoints |
| --- | --- |
| Saúde | `GET /health` (público) |
| Autenticação | `POST /auth/login`, `POST /auth/refresh`, `POST /auth/register` (públicos); `POST /auth/logout` (encerra a sessão pelos cookies); `GET /auth/profile` (autenticado) |
| Clientes | `GET/POST /clients`, `GET/PUT/DELETE /clients/:id` |
| Endereços | `GET/POST /clients/:id/addresses`, `PUT/DELETE /clients/:id/addresses/:addressId` |
| Contatos | `GET/POST /clients/:id/contacts`, `PUT/DELETE /clients/:id/contacts/:contactId` |
| Documentos | `GET/POST /clients/:id/documents`, `DELETE /clients/:id/documents/:documentId` |
| Dashboard | `GET /dashboard/summary` |
| Interações | `GET/POST /interactions`, `DELETE /interactions/:id` |
| Lookups | `GET/POST /lookups/:resource`, `PUT/DELETE /lookups/:resource/:id` |
| Oportunidades | `GET/POST /opportunities`, `GET/PUT/DELETE /opportunities/:id`, `GET/POST /opportunities/:id/comments`, `GET /opportunities/:id/status-history`, `GET /opportunities/:id/logs` |
| Usuários | `GET /users`, `GET/PUT/DELETE /users/:id` |

As respostas seguem o formato `{ "success": boolean, "data": ..., "message"?: string }`. Erros de rota retornam `success: false` e uma mensagem; erros internos não expõem detalhes da exceção na resposta HTTP.

## Autenticação e segurança

- Os tokens são enviados em cookies `HttpOnly`; o frontend deve enviar as requisições com credenciais habilitadas.
- O access token tem validade curta e o refresh token permite renovar a sessão conforme os valores configurados.
- CORS permite credenciais e usa a origem configurada em `CORS_ORIGIN`. Requisições que alteram dados também passam pela validação do cabeçalho `Origin`.
- Em produção, defina `NODE_ENV=production`, use `ACCESS_TOKEN_SECRET` aleatório com pelo menos 32 bytes, configure `DATABASE_URL` e informe a origem pública exata do frontend em `CORS_ORIGIN`.
- Cookies de produção usam `Secure`, `SameSite=None` e nomes com prefixo `__Host-`; sirva a API por HTTPS.

## Organização do código

```text
backend/
├── database/
│   ├── models/          Consultas e persistência por entidade
│   ├── migrations/      Migrações do banco
│   ├── schema.sql       Schema completo
│   ├── seed.js          Dados iniciais idempotentes
│   └── connection.js    Configuração Knex/PostgreSQL
├── src/
│   ├── config/          Ambiente e JWT
│   ├── controllers/     Entrada e resposta HTTP
│   ├── middleware/      Autenticação, validação e origem
│   ├── routes/          Rotas Express por domínio
│   ├── services/        Regras de negócio
│   └── utils/           Cookies, respostas, paginação e sanitização
├── .env.example         Modelo de configuração local
├── index.js             Inicialização e encerramento gracioso
└── package.json         Scripts e dependências
```

## Manutenção do banco

O schema versionado está em `database/schema.sql`. O comando `npm run db:schema` aplica esse arquivo ao banco definido por `DATABASE_URL`. Os dados de referência usados pela aplicação estão em `database/seed.js` e são carregados por `npm run seed`.

Não versione dumps de bancos locais, credenciais, arquivos `.env` ou dados reais exportados. O `.gitignore` da raiz e o arquivo local do backend excluem esses artefatos; `.env.example`, schema e scripts de seed permanecem versionáveis.
