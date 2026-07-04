# ADR-001: Arquitetura base da marketplace-api

## Status

Aceita

## Data

2026-07-04

## Contexto

A plataforma Gestao Marketplace possui frontend hospedado na Vercel em `app.gestaomarketplace.tech` e precisa integrar com multiplos servicos externos:

- Shopee Open API v2;
- Mercado Livre API;
- Tiny ERP;
- Google Drive;
- Cloudinary;
- Supabase.

Cada provedor possui credenciais, tokens, regras de autenticacao, limites, callbacks, webhooks e formatos proprios.

Se o frontend chamar diretamente esses provedores, o sistema ficara mais fragil:

- tokens podem ficar expostos;
- regras de integracao ficam espalhadas;
- logs ficam inconsistentes;
- fica dificil executar jobs e retentativas;
- multiplas contas por marketplace se tornam mais dificeis de controlar;
- mudancas de API externa impactam diretamente o frontend.

## Decisao

Centralizar todas as integracoes externas no backend `marketplace-api`.

A API sera hospedada na Hostinger VPS Ubuntu 24.04 em:

```text
https://api.gestaomarketplace.tech
```

Ela sera executada com:

- Node.js 22;
- TypeScript;
- Fastify;
- Prisma;
- Supabase;
- PM2;
- Nginx;
- HTTPS via Let's Encrypt.

O frontend em `app.gestaomarketplace.tech` chamara apenas a `marketplace-api`.

Tambem foi decidido criar um Centro de Integracoes / Configuracoes, responsavel por:

- cadastrar integracoes;
- armazenar credenciais;
- armazenar tokens;
- controlar status;
- registrar logs;
- armazenar parametros;
- permitir multiplas contas por marketplace;
- separar regras de negocio de detalhes tecnicos de APIs externas.

## Consequencias positivas

- Tokens e credenciais ficam protegidos no backend.
- O frontend fica mais simples.
- Integracoes externas ficam isoladas.
- Logs e auditoria ficam centralizados.
- Jobs e filas podem ser usados para processos longos.
- Novos marketplaces podem ser adicionados com menor impacto.
- Multiplas contas por marketplace passam a ser um conceito nativo.

## Consequencias negativas

- A API passa a ser um componente critico de infraestrutura.
- E necessario monitorar PM2, Nginx, HTTPS e logs.
- Deploys do backend passam a exigir cuidado operacional.
- A modelagem de integracoes precisa ser bem definida desde o inicio.

## Alternativas consideradas

### Integrar diretamente pelo frontend

Rejeitada.

Motivo: exposicao de tokens, dificuldade de refresh, ausencia de jobs confiaveis e alto acoplamento com APIs externas.

### Manter integracoes dentro do frontend Next.js

Rejeitada como solucao principal.

Motivo: mistura responsabilidades de UI, negocio e integracao tecnica. Tambem dificulta hospedar processos longos, filas e webhooks.

### Criar um backend centralizado

Aceita.

Motivo: melhor separacao de responsabilidades, maior seguranca, melhor rastreabilidade e base mais adequada para crescimento da plataforma.
