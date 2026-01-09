## Estado Atual do Repositório

* O projeto é uma biblioteca cliente WhatsApp (fork do Baileys), sem servidor HTTP e sem API REST.

* Já existem módulos robustos para autenticação (Signal keys), envio/recebimento de mensagens, grupos, contatos, store e logging com `pino`.

* Ausências: endpoints HTTP, JWT, OpenAPI/Swagger, rate limiting, webhooks, Docker.

## Objetivos

* Expor todas as funcionalidades principais do Whaileys via API REST segura.

* Cobrir sessões, mensagens (texto, mídia, documentos, interativas), contatos, grupos, perfil/status, webhooks.

* Incluir documentação OpenAPI completa, validação, erros padronizados, JWT, rate limiting e logs estruturados.

* Entregar Docker e ambiente de demonstração funcional.

## Arquitetura Técnica

* Runtime: Node.js + TypeScript.

* Servidor: Fastify (alto desempenho, schemas JSON, integração nativa com `pino`).

* Logs: `pino` (reutilizar padrão já usado na lib), correlação por `requestId`.

* Autenticação: `@fastify/jwt` (HS256), segredo via `JWT_SECRET`.

* Rate limiting: `@fastify/rate-limit` (limites por IP e por sessão).

* Validação: Schemas JSON (AJV via Fastify) + utilidades para converter esquemas a OpenAPI.

* OpenAPI: `@fastify/swagger` + `@fastify/swagger-ui` com tags por módulo e exemplos.

* Configuração: `dotenv` + `env-schema` (validação de variáveis de ambiente).

* Integração Whaileys: `useMultiFileAuthState` por sessão, `makeWASocket` com `DEFAULT_CONNECTION_CONFIG`, store em memória por sessão.

* Webhooks: fila assíncrona + entregas com `axios` (retries/backoff, assinatura HMAC opcional).

## Estrutura de Pastas

* `src/server.ts`: bootstrap Fastify, plugins, swagger, rate-limit, CORS.

* `src/config/`: `env.ts`, `logger.ts` (pino), `openapi.ts`.

* `src/core/`: erros padronizados, interceptors, utilitários.

* `src/sessions/`: gerenciador de sessões (`SessionManager`) e stores por sessão.

* `src/modules/`

  * `auth/`: JWT da API; endpoints `/auth/*`.

  * `session/`: controle WhatsApp (QR, status, logout); endpoints `/sessions/*`.

  * `messages/`: envio/consulta; endpoints `/messages/*`.

  * `interactive/`: mensagens interativas; endpoints `/interactive/*`.

  * `media/`: upload/stream/download; endpoints `/media/*`.

  * `contacts/`: contatos; endpoints `/contacts/*`.

  * `groups/`: gestão de grupos; endpoints `/groups/*`.

  * `profile/`: nome, foto, status; endpoints `/profile/*`.

  * `webhooks/`: CRUD e entrega; endpoints `/webhooks/*`.

* `src/docs/`: OpenAPI YAML/JSON gerado e helpers.

* `src/docker/`: Dockerfile e compose.

## Endpoints Principais

* Autenticação JWT (API)

  * `POST /auth/token` (username/password simples, configurável via env)

  * `POST /auth/refresh`

* Sessão WhatsApp

  * `POST /sessions` (criar sessão, retorna `sessionId`)

  * `GET /sessions/:id/qr` (QR atual em base64 + `expiresAt`)

  * `GET /sessions/:id/status` (conexão, device, pushname)

  * `DELETE /sessions/:id` (logout e remoção de credenciais)

  * `GET /sessions` (listar sessões ativas)

* Mensagens

  * `POST /messages/send` (texto)

  * `POST /messages/send-media` (imagem/áudio/vídeo/documento; upload multipart)

  * `POST /messages/send-document` (MIME detect, nome do arquivo)

  * `GET /messages/:chatId` (pagina mensagens do store)

  * `POST /messages/:messageId/read` (marcar como lida)

  * `POST /messages/:messageId/reaction` (emoji)

  * `DELETE /messages/:messageId` (excluir para mim)

* Interativas

  * `POST /interactive/buttons` (botões de resposta)

  * `POST /interactive/list` (lista com seções)

  * `POST /interactive/template` (templatizada com quick replies)

* Contatos

  * `GET /contacts` (lista)

  * `GET /contacts/:jid` (detalhe)

  * `POST /contacts/block` / `POST /contacts/unblock`

* Grupos

  * `POST /groups` (criar)

  * `GET /groups/:jid` (metadados)

  * `POST /groups/:jid/participants` (add/remove/promote/demote)

  * `PATCH /groups/:jid` (subject/description/ephemeral/settings)

  * `POST /groups/:jid/invite` (gerar/consumir convite)

* Perfil e Status

  * `GET /profile/me`

  * `PATCH /profile/me` (nome, status)

  * `POST /profile/photo` (upload imagem)

  * `GET /status/:jid` (status público)

* Webhooks

  * `POST /webhooks` (registrar URL por `sessionId`)

  * `GET /webhooks` / `DELETE /webhooks/:id`

  * Entregas: `messages.upsert`, `messages.update`, `messages.delete`, `connection.update`, `groups.update`, `presence.update`, etc.

## Validação de Entrada

* Schemas JSON por endpoint: tipos, formatos (JIDs), limites (tamanho de mídia), paginação.

* Middleware de validação automática via Fastify (`schema: { body, params, querystring }`).

* Conversão de schemas para OpenAPI para manter documentação sincronizada.

## Tratamento de Erros Padronizado

* Formato: `{ error: { code, message, details, requestId } }`.

* Mapeamento Boom→HTTP status quando originado do Whaileys.

* Handler global de erros e respostas consistentes.

## Segurança

* JWT obrigatório em todas as rotas (exceto `/auth/token`, `/sessions/:id/qr` opcionalmente protegido).

* CORS configurável.

* Sanitização de inputs e cabeçalhos.

* Não logar credenciais nem conteúdo sensível.

## Rate Limiting

* Limite global por IP.

* Limites específicos por rota (ex.: envios de mídia mais restritos).

* Limite por `sessionId` para evitar abuso.

## Logs Estruturados

* `pino` com níveis, contexto (`sessionId`, `jid`).

* Logs de auditoria para ações sensíveis (criar sessão, sair, alterar participantes).

* Correlacionar entregas de webhooks com eventos do socket.

## Webhooks para Eventos

* Buffer/queue interno com retries exponenciais.

* Assinatura HMAC do payload (`WEBHOOK_SECRET`).

* Reexecução em caso de falha e DLQ opcional em memória.

## Documentação Swagger/OpenAPI

* `@fastify/swagger` com tags por módulo, exemplos de requisição/resposta.

* Segurança `bearerAuth` global.

* Anexos: códigos de erro, limites e melhores práticas.

## Docker e Deploy

* Dockerfile multi-stage (build + runtime node:20-alpine).

* `.dockerignore` adequado.

* `docker-compose.yml` para demo (variáveis `JWT_SECRET`, `WEBHOOK_SECRET`, diretório de sessões montado em volume).

## Ambiente de Demonstração

* Script `npm run demo` iniciando API e uma sessão de teste.

* Endpoint `GET /health` e `GET /docs` (Swagger UI).

* Exemplo de webhook local com receiver simples.

## Compatibilidade Baileys/Whaileys

* Reutilizar `makeWASocket` e estruturas de mensagens originais.

* Não alterar formatos internos; apenas transformar payloads HTTP para os formatos aceitos pela lib.

## Testes e Verificação

* Testes de integração com `jest` cobrindo principais rotas.

* Mocks de envio de mídia e webhooks.

* Validação de OpenAPI sem erros.

## Plano de Implementação (Etapas)

1. Inicializar servidor Fastify, `pino`, CORS, health.
2. Adicionar JWT, rate-limit e configuração de ambiente.
3. Implementar `SessionManager` e rotas de sessão (QR, status, logout).
4. Implementar rotas de mensagens (texto, mídia, documentos) e store.
5. Implementar rotas de interativas (buttons/list/template).
6. Implementar contatos e grupos (CRUD/ações).
7. Implementar perfil/status.
8. Implementar webhooks (CRUD + entrega) com retries.
9. Integrar Swagger com schemas e exemplos.
10. Empacotar Docker e compose.
11. Criar demo e testes de integração.

## Confirmação

* Confirme para prosseguirmos com a implementação conforme o plano acima. Podemos ajustar nomes de rotas e políticas (ex.: proteção do endpoint de QR) conforme sua preferência.

