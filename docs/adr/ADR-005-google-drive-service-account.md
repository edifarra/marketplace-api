# ADR-005: Google Drive via Service Account como Fluxo Inicial

## Status

Aceita

## Data

2026-07-04

## Contexto

O processo de fotos depende de arquivos localizados no Google Drive, inclusive em pastas usadas como Root do fluxo operacional.

Uma base OAuth de usuario foi preparada anteriormente, mas o historico do projeto mostrou que esse caminho nao atendeu o fluxo inicial de fotos como esperado.

## Decisao

Usar Service Account como caminho preferencial inicial da integracao Google Drive.

OAuth permanece disponivel nas rotas ja criadas, mas passa a ser tratado como alternativa futura/experimental.

Variaveis de ambiente principais:

- `GOOGLE_SERVICE_ACCOUNT_JSON`
- `GOOGLE_DRIVE_ROOT_FOLDER_ID` opcional

Rota principal de validacao:

- `POST /integrations/googledrive/service-account/test`

Essa rota autentica com a Service Account, lista ate 10 arquivos acessiveis e, quando `GOOGLE_DRIVE_ROOT_FOLDER_ID` estiver definido, lista arquivos dessa pasta.

Quando o teste funciona, a API:

- atualiza `IntegrationConfig` do provider `googledrive`;
- define `status` como `connected`;
- define `authType` como `service_account`;
- salva `rootFolderId` em `settingsJson` quando existir;
- salva apenas chaves/identificadores seguros em `credentialsJson`;
- registra log em `IntegrationLog`.

## Consequencias positivas

- O fluxo inicial fica alinhado ao historico operacional do processo de fotos.
- A API pode validar acesso sem depender do consentimento OAuth de um usuario final.
- O caminho de producao fica mais previsivel para pastas compartilhadas.
- Tokens e o JSON completo da Service Account nao sao expostos nas respostas publicas.

## Consequencias negativas

- Pastas do My Drive pessoal precisam ser compartilhadas com o e-mail da Service Account.
- Sem `GOOGLE_DRIVE_ROOT_FOLDER_ID`, a Service Account lista apenas arquivos acessiveis a ela.
- OAuth ainda precisara de nova validacao antes de virar caminho principal.

## Decisoes de seguranca

- O JSON completo da Service Account deve ficar apenas em variavel de ambiente.
- A API nao retorna `private_key`, token de acesso nem JSON completo de credenciais.
- `credentialsJson` guarda apenas metadados seguros, como `credentialKeys` e `client_email`.
- O escopo inicial permanece somente leitura: `https://www.googleapis.com/auth/drive.readonly`.
