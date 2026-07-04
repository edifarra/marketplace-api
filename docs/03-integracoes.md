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
- preferencialmente autenticar via OAuth do usuario;
- acessar o Drive real do usuario;
- permitir leitura da pasta Root;
- localizar arquivos conforme regras de nome e processo de produto.

A Service Account pode existir como alternativa tecnica, mas o fluxo preferencial e OAuth do usuario.

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
