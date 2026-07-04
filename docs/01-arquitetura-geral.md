# Arquitetura Geral

## Visao

A `marketplace-api` e a API central da plataforma Gestao Marketplace. Ela concentra os processos de integracao com marketplaces, ERP, armazenamento de imagens, Google Drive, banco de dados, configuracoes, tokens e logs.

O frontend nao deve conversar diretamente com APIs externas de marketplace. Toda integracao externa deve passar pela `marketplace-api`.

## Topologia

```text
Usuario
  |
  v
Frontend Vercel
app.gestaomarketplace.tech
  |
  v
Backend Hostinger VPS
api.gestaomarketplace.tech
  |
  +--> Supabase
  +--> Shopee Open API v2
  +--> Mercado Livre API
  +--> Tiny ERP
  +--> Google Drive
  +--> Cloudinary
```

## Componentes

### Frontend

- Hospedado na Vercel.
- Dominio: `app.gestaomarketplace.tech`.
- Responsavel por telas, formularios, paineis e acionamento de processos.
- Nao deve armazenar tokens sensiveis de integracoes externas.
- Nao deve chamar diretamente Shopee, Mercado Livre, Tiny, Google Drive ou Cloudinary.

### Backend

- Hospedado na Hostinger VPS com Ubuntu 24.04.
- Dominio: `api.gestaomarketplace.tech`.
- API HTTPS publicada via Nginx e Let's Encrypt.
- Aplicacao Node.js 22 com Fastify e TypeScript.
- Processo gerenciado por PM2.
- Porta interna: `3001`.

### Banco e persistencia

- Supabase sera usado para banco, configuracoes, tokens, logs e dados persistentes.
- Prisma sera usado como camada de acesso estruturado ao banco quando o dominio exigir consultas mais complexas e tipadas.
- O Supabase Client sera usado para operacoes administrativas ou compatibilidade com recursos especificos do Supabase.

## Regra principal

Todas as integracoes externas devem passar pela `marketplace-api`.

Isso inclui:

- autenticacao OAuth;
- refresh de tokens;
- publicacao de produtos;
- sincronizacao de estoque;
- importacao de pedidos;
- webhooks;
- logs de execucao;
- armazenamento e tratamento de imagens;
- leitura de fotos no Google Drive.

## Estrutura alvo

```text
src/
  config/
  modules/
    integrations/
    auth/
    shopee/
    mercadolivre/
    products/
    inventory/
    orders/
    webhooks/
  integrations/
    supabase/
    googledrive/
    cloudinary/
    tiny/
  jobs/
  queue/
  middleware/
  services/
  utils/
  shared/
```

## Separacao por responsabilidade

`modules/` contem regras de negocio da plataforma.

`integrations/` contem detalhes tecnicos de APIs externas.

`services/` contem servicos compartilhados pela aplicacao, como clientes de banco, logs e recursos de infraestrutura.

`jobs/` contem rotinas executadas em segundo plano.

`queue/` contem a camada de filas e processamento assicrono.

`shared/` contem tipos, contratos e utilitarios compartilhados entre modulos.

## Estado atual

Nesta fase, a API possui apenas a arquitetura base e os endpoints iniciais:

- `GET /`
- `GET /health`

Nenhuma integracao real deve ser implementada nesta etapa.
