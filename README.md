# Roberto Pneus App

SaaS multi-tenant de gestão de oficina mecânica e centro automotivo  
**Autorizada Michelin** · Mobile-first · WhatsApp + IA · **PWA**

---

## Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | Next.js 15 (App Router) + TypeScript + Tailwind CSS + shadcn/ui |
| Backend | Next.js API Routes + Server Actions |
| DB / Auth / Storage | Supabase (PostgreSQL + Auth + Storage) |
| ORM | Prisma |
| Estado | TanStack Query + Zustand |
| Forms | React Hook Form + Zod |
| PDF | @react-pdf/renderer |
| Calendário | react-big-calendar |
| IA | OpenAI GPT-4o-mini (Function Calling) |
| WhatsApp | Evolution API (abstração `WhatsAppService`) |
| PWA | Service Worker + Web Manifest |
| Deploy | Vercel |

---

## Fases entregues

1. **Fundação** — multi-tenant, auth, design system, layout  
2. **Cadastros** — clientes, veículos, tipos de manutenção, usuários  
3. **Core** — agendamentos, OS completa, PDF, tracking público  
4. **Comunicação** — chat, templates WhatsApp, Evolution, notificações  
5. **Pneus + IA** — catálogo, estoque, agente com tools  
6. **Polish** — PWA, UX mobile, docs de deploy  

---

## Desenvolvimento (modo demo)

Não precisa de Supabase para explorar a UI:

```bash
cd roberto-pneus-app
npm install
npm run prepare:env   # cria .env.local a partir do example
npm run dev
```

Abra http://localhost:3000 — entra como **Admin Demo** com `DEMO_MODE=true`.

### Scripts úteis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Next.js + Turbopack |
| `npm run build` | Build de produção |
| `npm run start` | Serve o build |
| `npm run typecheck` | TypeScript |
| `npm run lint` | ESLint |
| `npm run db:generate` | Prisma Client |
| `npm run db:migrate` | Migrations |
| `npm run db:seed` | Seed (tenant, templates…) |
| `npm run icons` | Regenera ícones PWA |

---

## Configurar Supabase (produção)

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Em **Project Settings → API**, copie:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server only)
3. Em **Database → Connection string**:
   - Pooler (transaction) → `DATABASE_URL` (porta 6543, `?pgbouncer=true`)
   - Session/direct → `DIRECT_URL` (porta 5432)
4. No `.env.local` / Vercel:
   ```env
   DEMO_MODE=false
   NEXT_PUBLIC_DEMO_MODE=false
   NEXT_PUBLIC_APP_URL=https://seu-dominio.vercel.app
   ```
5. Rode o schema:
   ```bash
   npx prisma migrate dev --name init
   npm run db:seed
   ```
6. Crie usuário no **Supabase Auth** e alinhe `users.authUserId` na tabela `users` com o UUID do Auth (ou use o fluxo de criação de usuário do Admin no app quando o service role estiver ativo).
7. (Opcional) Bucket Storage `vehicle-documents` público/autenticado para fotos de veículos.

> Enquanto `DEMO_MODE=true`, o app usa store em memória (ótimo para demos). Desative para persistir no Postgres.

---

## Agente de IA (OpenAI)

1. Obtenha uma chave em [platform.openai.com](https://platform.openai.com).
2. Configure:
   ```env
   OPENAI_API_KEY=sk-...
   OPENAI_MODEL=gpt-4o-mini
   AI_AGENT_FORCE_DEMO=false
   ```
3. Teste em `/agente-ia` ou `POST /api/agent/chat` com `{ "message": "pneu 205/55R16 Civic" }`.
4. Sem chave (ou com `AI_AGENT_FORCE_DEMO=true`), o agente usa heurística + as mesmas tools (catálogo, OS, agenda).

**Tools:** `buscar_pneus`, `verificar_compatibilidade`, `consultar_estoque`, `criar_agendamento`, `consultar_status_os`, `informacoes_oficina`.

---

## Evolution API (WhatsApp)

1. Suba uma instância Evolution e conecte o número.
2. Configure:
   ```env
   EVOLUTION_API_URL=https://sua-evolution
   EVOLUTION_API_KEY=...
   EVOLUTION_INSTANCE=roberto-pneus
   ```
3. Webhook de entrada: `POST https://seu-dominio/api/webhooks/whatsapp`  
   (o agente processa mensagens e responde via `WhatsAppService`)
4. Em DEMO / sem Evolution: envios são **simulados** (console + `WhatsAppMessageLog`).
5. Templates editáveis em **Configurações → Mensagens automáticas**.

---

## PWA (instalar no celular)

### Testar em produção local

```bash
npm run build
npm run start
```

Abra http://localhost:3000 no Chrome/Edge (desktop ou remote debug no Android).

1. Ícone de instalação na barra de endereço **ou** banner “Instalar Roberto Pneus”.
2. No Android Chrome: menu → **Instalar app** / **Adicionar à tela inicial**.
3. No iOS Safari: Compartilhar → **Adicionar à Tela de Início**.

### Dev com service worker (opcional)

```env
NEXT_PUBLIC_PWA_DEV=true
```

Arquivos: `public/sw.js`, `public/manifest.webmanifest`, `public/icons/*`, `src/app/manifest.ts`.

---

## Deploy na Vercel

1. Push do repositório para o GitHub.
2. [vercel.com](https://vercel.com) → **Import project**.
3. Framework: **Next.js** (detectado automaticamente).
4. Configure **todas** as variáveis de `.env.example` no painel da Vercel (sem `DEMO_MODE=true` em produção real).
5. Deploy.
6. Ajuste `NEXT_PUBLIC_APP_URL` para a URL da Vercel (ou domínio custom).
7. Rode migrations contra o Supabase (local ou CI):
   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```
8. Teste login, uma OS e o webhook (se Evolution estiver no ar).

**Dicas Vercel + Supabase**
- Use connection pooling na `DATABASE_URL`.
- Não exponha `SUPABASE_SERVICE_ROLE_KEY` nem `OPENAI_API_KEY` no client.
- Storage/Realtime exigem URLs públicas HTTPS (Vercel ok).

---

## Multi-tenant

- Entidades principais têm `tenantId`.
- Sessão carrega `user.tenantId`; actions usam `requireSession()` / `requireRole()`.
- Queries de demo e Prisma filtram por tenant.
- Webhook usa `DEFAULT_TENANT_ID` até mapear `EVOLUTION_INSTANCE → tenant`.

---

## Estrutura (resumo)

```
src/
  app/(auth)/login
  app/(dashboard)/…     # app autenticado
  app/acompanhamento/   # tracking público
  app/api/              # webhooks + agent
  components/           # UI por domínio
  lib/data/             # demo store + repositórios
  lib/ia-agent/         # Function Calling
  lib/whatsapp/         # Evolution + templates
  middleware.ts
prisma/schema.prisma
public/sw.js + icons/
```

---

## Licença

Privado — Roberto Pneus / projeto interno.
