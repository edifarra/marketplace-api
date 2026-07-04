# Processos

## Objetivo

Este documento descreve os processos planejados para a `marketplace-api`.

Nesta fase, os processos ainda nao estao implementados. O objetivo e registrar o fluxo esperado para orientar a evolucao.

## Cadastro e configuracao de integracoes

Fluxo previsto:

1. Usuario acessa o frontend em `app.gestaomarketplace.tech`.
2. Frontend chama a `marketplace-api`.
3. API cadastra ou atualiza uma integracao no Centro de Integracoes / Configuracoes.
4. API armazena credenciais, tokens, parametros e status no Supabase.
5. API registra log da operacao.

## OAuth

Fluxo previsto:

1. Usuario solicita conexao de uma conta.
2. Frontend solicita a URL de autorizacao para a `marketplace-api`.
3. API gera a URL correta conforme o provedor.
4. Usuario autoriza no provedor externo.
5. Provedor retorna para callback da API.
6. API troca o code por tokens.
7. API salva tokens, identificadores e dados brutos seguros no Supabase.
8. API registra logs e atualiza status da integracao.

## Produtos

Fluxo previsto:

1. Produto e criado ou atualizado no sistema.
2. API valida configuracoes e regras de negocio.
3. API prepara dados de envio.
4. API envia para destino configurado:
   - marketplace direto;
   - Tiny ERP;
   - outro integrador futuro.
5. API salva vinculos externos.
6. API registra logs.

## Imagens

Fluxo previsto:

1. API busca fotos no Google Drive.
2. API valida padrao dos nomes.
3. API agrupa fotos por produto.
4. API processa imagens locais quando necessario.
5. API envia imagens ao Cloudinary.
6. API salva URLs e caminhos de processamento.
7. API registra logs detalhados.

## Estoque

Fluxo previsto:

1. API consulta estoque interno.
2. API consulta estoque nos marketplaces conectados.
3. API consolida por SKU.
4. API identifica divergencias.
5. API aplica regras:
   - atualizar sistema;
   - atualizar marketplaces;
   - pausar anuncio com estoque zero;
   - registrar divergencia para revisao.
6. API registra logs.

## Pedidos

Fluxo previsto:

1. API recebe pedidos via webhook ou rotina de sincronizacao.
2. API identifica SKU e conta de marketplace.
3. API reduz estoque interno.
4. API propaga atualizacao para demais marketplaces.
5. API registra pedido e logs.

## Webhooks

Fluxo previsto:

1. Provedor externo chama endpoint da `marketplace-api`.
2. API valida autenticidade do evento.
3. API registra evento bruto.
4. API envia evento para fila ou job interno.
5. API processa de forma idempotente.

## Jobs e filas

Jobs e filas devem ser usados para processos demorados:

- sincronizacao de estoque;
- leitura de pedidos;
- processamento de imagens;
- envio em lote;
- retentativas de integracoes externas.

O endpoint HTTP deve responder rapidamente sempre que possivel. Processos longos devem ser executados em segundo plano.

## Logs e auditoria

Todo processo relevante deve registrar:

- integracao;
- conta;
- acao;
- status;
- payload relevante;
- erro completo quando existir;
- data e hora;
- correlacao com produto, SKU, pedido ou anuncio.
