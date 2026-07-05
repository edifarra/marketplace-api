# ADR-003: Finalizacao da Central de Integracoes

## Status

Aceita

## Data

2026-07-04

## Contexto

O modulo `src/modules/integrations` ja centraliza os providers configuraveis e persiste os registros padrao no Supabase.

A proxima etapa precisava completar a operacao administrativa da Central de Integracoes sem iniciar chamadas reais para APIs externas e sem introduzir arquitetura de plugins.

## Decisao

Manter a arquitetura modular atual e finalizar a Central de Integracoes com:

- CRUD seguro de configuracao por provider;
- atualizacao de `displayName`, `status`, `authType`, `settingsJson` e `credentialsJson`;
- respostas publicas sem exposicao integral de `credentialsJson`;
- endpoint consolidado de status por provider;
- tabela `IntegrationLog` para logs basicos;
- endpoints de logs globais e filtrados por provider;
- testes controlados por provider.

O endpoint `POST /integrations/:provider/test` continua sem chamadas reais para APIs externas. Para `supabase`, o teste consulta `IntegrationConfig` e retorna sucesso quando o banco esta acessivel.

## Consequencias positivas

- A tela administrativa pode consultar status e historico basico por provider.
- Atualizacoes de credenciais ficam centralizadas e nao vazam nas respostas da API.
- O modulo passa a ter auditoria minima para suporte e diagnostico.
- A evolucao para testes reais pode acontecer provider por provider, sem mudar o contrato inicial.

## Consequencias negativas

- Os logs ainda sao basicos e nao substituem observabilidade estruturada.
- As credenciais ainda dependem de uma etapa futura de criptografia/segregacao mais forte.
- Testes reais de APIs externas continuam pendentes.

## Decisoes de seguranca

- `credentialsJson` pode ser persistido, mas nunca deve ser retornado integralmente em rotas publicas.
- As respostas podem expor apenas `hasCredentials` e `credentialKeys`.
- `provider` nao pode ser alterado pelo corpo do `PATCH`; ele e sempre definido pela URL validada.
- Erros controlados devem retornar mensagens previsiveis e registrar log quando houver banco disponivel.
