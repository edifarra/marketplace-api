# Marketplace API

API central de integracao do sistema de marketplaces.

Este projeto e independente do frontend existente. Ele foi preparado para Node.js 22, TypeScript, Fastify, Prisma, Supabase, dotenv, Zod e Pino.

## Endpoints iniciais

`GET /`

```json
{
  "application": "Marketplace API",
  "status": "running"
}
```

`GET /health`

```json
{
  "status": "ok",
  "version": "1.0.0"
}
```

## Requisitos

- Node.js 22+
- npm
- PostgreSQL ou Supabase Postgres
- PM2 para producao em Ubuntu 24.04
- Nginx como reverse proxy

## Configuracao local

1. Copie `.env.example` para `.env`.
2. Ajuste `DATABASE_URL`, `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`.
3. Instale as dependencias:

```bash
npm install
```

4. Gere o Prisma Client:

```bash
npm run prisma:generate
```

5. Inicie em desenvolvimento:

```bash
npm run dev
```

## Build e execucao

```bash
npm run build
npm start
```

## PM2 em Ubuntu 24.04

```bash
npm run build
pm2 start dist/server.js --name marketplace-api
pm2 save
```

## Nginx reverse proxy

Exemplo de bloco:

```nginx
server {
    listen 80;
    server_name api.seudominio.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Arquitetura

A pasta `src/modules` separa os dominios principais. Integracoes reais ainda nao foram implementadas; cada modulo possui um placeholder para manter a estrutura preparada.

Fluxo base:

- `src/server.ts`: ponto de entrada do processo.
- `src/app.ts`: cria e configura a instancia Fastify.
- `src/config/env.ts`: valida variaveis de ambiente com Zod.
- `src/routes/health.ts`: rotas basicas de status.
- `src/services`: clientes compartilhados, como Prisma e Supabase.
- `src/modules`: dominios de negocio e integracoes.
