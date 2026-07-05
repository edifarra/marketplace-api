# ADR-004: Google Drive via OAuth do Usuario

## Status

Aceita, parcialmente substituida pela ADR-005 para o fluxo inicial

## Data

2026-07-04

## Contexto

O processo de fotos depende do Drive real do usuario, incluindo arquivos localizados no My Drive e na pasta Root.

Service Accounts nao acessam automaticamente o My Drive pessoal do usuario. Elas exigem compartilhamento explicito ou delegacao de dominio, o que nao atende ao fluxo inicial da plataforma.

Atualizacao: o historico do projeto mostrou que OAuth nao atendeu o fluxo inicial de fotos como esperado. A ADR-005 define Service Account como caminho preferencial inicial. As rotas OAuth permanecem disponiveis como alternativa futura/experimental.

## Decisao

Implementar a base da integracao Google Drive usando OAuth 2.0 do usuario dentro da `marketplace-api`.

Rotas iniciais:

- `GET /integrations/googledrive/auth/start`
- `GET /integrations/googledrive/auth/callback`
- `GET /integrations/googledrive/status`
- `POST /integrations/googledrive/test`

Variaveis de ambiente:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`

Escopo inicial:

```text
https://www.googleapis.com/auth/drive.readonly
```

O callback troca o `code` por tokens e salva os dados em `IntegrationConfig.credentialsJson` do provider `googledrive`:

- `access_token`
- `refresh_token`
- `expiry_date`
- `scope`
- `token_type`

O teste inicial usa o token salvo para listar ate 5 arquivos do Drive na pasta Root. O processamento de fotos ainda nao faz parte desta etapa.

## Consequencias positivas

- A API acessa o Drive real autorizado pelo usuario.
- O fluxo inicial cobre My Drive e Root sem exigir compartilhamento manual com Service Account.
- A Central de Integracoes passa a ter uma primeira integracao com OAuth real.
- Tokens ficam centralizados no `IntegrationConfig` e nao vazam em respostas publicas.

## Consequencias negativas

- Requer configuracao correta do OAuth Client no Google Cloud.
- O usuario precisa autorizar a aplicacao.
- A renovacao de token depende da presenca de `refresh_token`, por isso o fluxo solicita acesso offline e consentimento.

## Decisoes de seguranca

- Tokens completos nunca devem ser retornados nas rotas publicas.
- Respostas podem exibir apenas `hasCredentials` e `credentialKeys`.
- O escopo inicial e somente leitura (`drive.readonly`).
- Logs devem registrar sucesso/erro sem incluir tokens.
