# ADR-002: Centro de Integracoes / Configuracoes

## Status

Aceita

## Data

2026-07-04

## Contexto

A plataforma precisa conectar com diferentes provedores externos:

- Shopee;
- Mercado Livre;
- Tiny;
- Google Drive;
- Cloudinary;
- Supabase.

Cada provedor possui credenciais, tokens, parametros, status de conexao e logs proprios.

Sem um modulo central, esses dados tenderiam a ficar espalhados entre modulos tecnicos, dificultando seguranca, auditoria e suporte a multiplas contas.

## Decisao

Criar o modulo `src/modules/integrations` como Centro de Integracoes / Configuracoes.

Esse modulo sera responsavel por:

- listar providers configuraveis;
- consultar configuracao por provider;
- atualizar configuracoes;
- armazenar credenciais e parametros;
- registrar status;
- preparar testes de conexao;
- garantir que credenciais nao sejam expostas integralmente nas respostas publicas da API.

O modelo Prisma inicial sera `IntegrationConfig`.

Providers iniciais:

- `shopee`
- `mercadolivre`
- `tiny`
- `googledrive`
- `cloudinary`
- `supabase`

Status iniciais:

- `disabled`
- `pending`
- `connected`
- `error`

Tipos de autenticacao:

- `oauth`
- `api_key`
- `internal`
- `manual`

## Consequencias positivas

- Ponto unico para configurar integracoes.
- Reducao de duplicidade entre modulos.
- Maior seguranca no tratamento de credenciais.
- Base para telas administrativas no frontend.
- Base para logs e auditoria de conexoes.
- Evolucao mais simples para multiplas contas e parametros por provedor.

## Consequencias negativas

- O modulo de integracoes passa a ser uma dependencia comum de outros modulos.
- Alteracoes no modelo exigem cuidado para nao quebrar provedores ja configurados.
- Ainda sera necessario evoluir criptografia e mascaramento de credenciais antes de producao completa.

## Decisoes de seguranca

- `credentialsJson` pode existir no banco.
- `credentialsJson` nao deve ser retornado integralmente pelas rotas publicas.
- A resposta pode indicar `hasCredentials` e `credentialKeys`.
- Credenciais reais devem ser tratadas apenas dentro de services/repositories autorizados.

## Estado inicial

Nesta etapa, nenhum teste real de integracao foi implementado.

`POST /integrations/:provider/test` retorna uma resposta controlada informando que o teste real ainda nao existe.
