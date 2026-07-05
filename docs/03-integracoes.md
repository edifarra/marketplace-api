# Integracoes

## Principio

O frontend nunca deve chamar diretamente APIs externas. Todas as integracoes devem passar pela `marketplace-api`.

Isso permite:

- proteger tokens e credenciais;
- padronizar logs;
- controlar limites de API;
- centralizar renovacao de tokens;
- permitir filas e retentativas;
- auditar alteracoes;
- manter uma arquitetura evolutiva para novos marketplaces.

## Centro de Integracoes / Configuracoes

Sera criado um modulo de Centro de Integracoes / Configuracoes.

Responsabilidades:

- cadastrar integracoes;
- armazenar credenciais;
- armazenar tokens;
- controlar status;
- registrar logs;
- armazenar parametros por conta;
- permitir multiplas contas por marketplace;
- concentrar testes de conexao;
- expor ao frontend somente dados seguros.

### Modelo inicial

O modelo base do Centro de Integracoes e `IntegrationConfig`.

Campos principais:

- `id`
- `provider`
- `displayName`
- `status`
- `authType`
- `credentialsJson`
- `settingsJson`
- `lastConnectedAt`
- `lastSyncAt`
- `createdAt`
- `updatedAt`

O modulo tambem possui `IntegrationLog` para auditoria basica das operacoes controladas.

Campos principais:

- `id`
- `provider`
- `action`
- `status`
- `message`
- `metadataJson`
- `createdAt`

Providers configuraveis inicialmente:

- `shopee`
- `mercadolivre`
- `tiny`
- `googledrive`
- `cloudinary`
- `supabase`

### Seed automatico inicial

Quando o banco esta disponivel, as leituras do Centro de Integracoes garantem automaticamente que os providers padrao existam na tabela `integration_configs`.

Na primeira chamada a `GET /integrations`, se a tabela estiver vazia, a API cria os registros iniciais para:

- `shopee`
- `mercadolivre`
- `tiny`
- `googledrive`
- `cloudinary`
- `supabase`

Cada registro inicial e persistido com `status` igual a `pending`, `authType` conforme o provider, `credentialsJson` vazio e `settingsJson` vazio. A operacao e idempotente: chamadas seguintes nao duplicam providers porque `provider` e unico no banco.

Depois desse seed, `GET /integrations` e `GET /integrations/:provider` retornam registros reais do banco, com `id`, `createdAt` e `updatedAt` preenchidos.

Status previstos:

- `disabled`
- `pending`
- `connected`
- `error`

Tipos de autenticacao:

- `oauth`
- `api_key`
- `internal`
- `manual`

### Rotas

As rotas do modulo sao:

- `GET /integrations`
- `GET /integrations/logs`
- `GET /integrations/:provider`
- `GET /integrations/:provider/status`
- `GET /integrations/:provider/logs`
- `POST /integrations/:provider/test`
- `PATCH /integrations/:provider`

Rotas especificas do Google Drive:

- `POST /integrations/googledrive/service-account/test`
- `GET /integrations/googledrive/auth/start`
- `GET /integrations/googledrive/auth/callback`
- `GET /integrations/googledrive/status`
- `POST /integrations/googledrive/test`

`PATCH /integrations/:provider` permite atualizar `displayName`, `status`, `authType`, `settingsJson` e `credentialsJson`. O `provider` vem sempre da URL e nao pode ser alterado pelo corpo da requisicao.

`GET /integrations/:provider/status` retorna uma visao consolidada e segura com:

- `provider`
- `displayName`
- `status`
- `authType`
- `hasCredentials`
- `credentialKeys`
- `lastConnectedAt`
- `lastSyncAt`
- `updatedAt`

`GET /integrations/logs` retorna os logs mais recentes de todas as integracoes. `GET /integrations/:provider/logs` retorna apenas os logs do provider informado.

O endpoint de teste ainda nao executa conexao real com APIs externas. Ele retorna uma resposta controlada e especifica por provider:

- Shopee: teste real ainda nao implementado;
- Mercado Livre: teste real ainda nao implementado;
- Tiny: teste real ainda nao implementado;
- Google Drive: teste real ainda nao implementado;
- Cloudinary: teste real ainda nao implementado;
- Supabase: consulta `IntegrationConfig` para confirmar que o banco esta acessivel.

As respostas publicas nao devem expor `credentialsJson` integralmente. A API pode informar apenas se existem credenciais e quais chaves foram cadastradas.

O modulo registra logs quando:

- uma integracao e atualizada;
- um teste de conexao e executado;
- ocorre um erro controlado em operacoes do Centro de Integracoes.

### Fallback local em desenvolvimento

Para permitir execucao local inicial sem banco real, o modulo possui fallback em memoria quando:

- `NODE_ENV=development`;
- o banco configurado em `DATABASE_URL` esta indisponivel;
- a rota chamada e de leitura ou teste inicial.

Nesse cenario, as rotas retornam os providers padrao em memoria:

- `shopee`
- `mercadolivre`
- `tiny`
- `googledrive`
- `cloudinary`
- `supabase`

As respostas incluem a origem:

```json
{
  "source": "memory",
  "data": []
}
```

Quando o banco responde normalmente, a origem sera:

```json
{
  "source": "database",
  "data": []
}
```

Em `production`, o fallback silencioso nao deve ser usado. Se o banco estiver indisponivel, a API deve responder erro controlado `503` com mensagem clara.

O fallback nao persiste alteracoes. Ele existe apenas para permitir que `GET /integrations`, `GET /integrations/:provider` e `POST /integrations/:provider/test` funcionem durante a primeira execucao local.

## Shopee Open API v2

Uso previsto:

- OAuth por loja;
- multiplas contas/lojas;
- cadastro e atualizacao de produtos;
- sincronizacao de estoque;
- leitura de pedidos;
- webhooks;
- pausas e ativacoes de anuncios.

Identificador principal previsto:

```text
shop_id
```

## Mercado Livre API

Uso previsto:

- OAuth por conta;
- multiplas contas;
- publicacao e atualizacao de anuncios;
- sincronizacao de estoque;
- leitura de pedidos;
- webhooks;
- pausas e ativacoes de anuncios.

Identificador principal previsto:

```text
seller_id
```

## Tiny ERP

Tiny sera uma integracao opcional para usuarios que preferirem operar via ERP.

Uso previsto:

- criar produto no Tiny;
- atualizar produto;
- inativar produto quando necessario;
- manter vinculo entre produto interno e produto Tiny.

O fluxo via Tiny nao substitui a capacidade de envio direto aos marketplaces.

## Google Drive

Uso previsto:

- buscar fotos e produtos;
- autenticar prioritariamente via Service Account;
- acessar o Drive real do usuario;
- permitir leitura da pasta Root;
- localizar arquivos conforme regras de nome e processo de produto.

Historicamente, o processo de fotos depende de arquivos na pasta Root do Google Drive. O fluxo OAuth de usuario nao atendeu esse processo de forma confiavel nas validacoes anteriores. Por isso, a estrategia inicial preferencial e Service Account.

Variaveis de ambiente:

- `GOOGLE_SERVICE_ACCOUNT_JSON`
- `GOOGLE_DRIVE_ROOT_FOLDER_ID` opcional
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`

`GOOGLE_SERVICE_ACCOUNT_JSON` deve conter o JSON da chave da Service Account. Ele tambem pode ser informado em Base64 para facilitar configuracao em ambientes de deploy.

Quando `GOOGLE_DRIVE_ROOT_FOLDER_ID` estiver definido, `POST /integrations/googledrive/service-account/test` lista ate 10 arquivos dessa pasta. Quando nao estiver definido, a API tenta listar ate 10 arquivos acessiveis no Drive da propria Service Account.

Para acessar pastas do Drive pessoal do usuario, a pasta precisa ser compartilhada com o e-mail da Service Account, salvo se houver outro mecanismo validado para aquele ambiente.

Escopo inicial:

```text
https://www.googleapis.com/auth/drive.readonly
```

Fluxo inicial preferencial:

1. Configurar `GOOGLE_SERVICE_ACCOUNT_JSON`.
2. Opcionalmente configurar `GOOGLE_DRIVE_ROOT_FOLDER_ID`.
3. Compartilhar a pasta do Drive pessoal com o e-mail da Service Account quando a pasta estiver no My Drive do usuario.
4. Executar `POST /integrations/googledrive/service-account/test`.
5. Se o teste funcionar, a API marca `googledrive` como `connected`, usa `authType` `service_account` e salva `rootFolderId` em `settingsJson` quando existir.

Fluxo OAuth alternativo e experimental:

1. `GET /integrations/googledrive/auth/start` redireciona para a URL OAuth do Google.
2. O Google retorna para `GET /integrations/googledrive/auth/callback` com `code`.
3. A API troca o `code` por tokens e salva em `IntegrationConfig.credentialsJson`.
4. A integracao `googledrive` passa para `connected`.
5. `POST /integrations/googledrive/test` valida acesso listando ate 5 arquivos do Drive na pasta Root.

Tokens completos nunca sao retornados nas respostas publicas. As rotas retornam somente `hasCredentials` e `credentialKeys`.

OAuth permanece disponivel como alternativa futura/experimental, mas nao e o caminho principal para o fluxo inicial de fotos.

## Cloudinary

Uso previsto:

- armazenar imagens de produto;
- tratar imagens;
- gerar links publicos;
- aplicar transformacoes, incluindo fundo branco quando necessario;
- preservar rastreabilidade entre arquivo local, arquivo original e URL final.

## Supabase

Uso previsto:

- banco principal;
- configuracoes;
- tokens;
- logs;
- produtos;
- anuncios;
- pedidos;
- estoque;
- auditoria de processos.

## Estado atual

Nenhuma integracao real esta implementada nesta API.

Esta documentacao define o desenho inicial para evolucao controlada.
