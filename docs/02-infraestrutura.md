# Infraestrutura

## Ambiente de hospedagem

A `marketplace-api` sera hospedada em uma VPS Hostinger com Ubuntu 24.04.

Dominio publico:

```text
https://api.gestaomarketplace.tech
```

## Stack de execucao

- Ubuntu 24.04
- Node.js 22
- TypeScript
- Fastify
- Prisma
- Supabase
- PM2
- Nginx
- Let's Encrypt

## Fluxo de rede

```text
Internet
  |
  v
Nginx HTTPS 443
api.gestaomarketplace.tech
  |
  v
PM2 / Node.js
localhost:3001
```

O Nginx recebe as requisicoes HTTPS e repassa para a aplicacao Node.js rodando internamente na porta `3001`.

## Processo Node.js

O processo da API deve ser gerenciado pelo PM2:

```bash
pm2 start dist/server.js --name marketplace-api
pm2 save
```

Reinicio automatico no boot:

```bash
pm2 startup
```

## Nginx

Exemplo de reverse proxy:

```nginx
server {
    listen 80;
    server_name api.gestaomarketplace.tech;

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

O HTTPS deve ser configurado com Let's Encrypt.

## Variaveis de ambiente

As configuracoes sensiveis ficam em `.env` no servidor:

- `NODE_ENV`
- `PORT`
- `HOST`
- `LOG_LEVEL`
- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

O arquivo `.env.example` documenta os nomes esperados sem expor segredos reais.

## Build e deploy

Fluxo esperado:

```bash
npm install
npm run prisma:generate
npm run build
pm2 restart marketplace-api
```

## Logs

Os logs da aplicacao usam Pino.

Em producao, o PM2 deve centralizar stdout e stderr:

```bash
pm2 logs marketplace-api
```

Logs de negocio e execucao de integracoes devem ser persistidos no Supabase para consulta pelo Centro de Integracoes / Configuracoes.

## Banco e persistencia

O Supabase sera a base principal de persistencia:

- configuracoes;
- credenciais criptografadas ou protegidas;
- tokens OAuth;
- logs;
- produtos;
- estoque;
- pedidos;
- vinculos com anuncios externos.

Prisma sera usado para acesso tipado e manutencao de schema quando apropriado.
