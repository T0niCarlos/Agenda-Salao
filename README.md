# Plataforma de Agendamento — Salões de Beleza (MVP)

Stack: Next.js (App Router) · React · TypeScript (strict) · Tailwind CSS ·
shadcn/ui · Supabase (Postgres + Auth) · Vercel.

## Setup

1. Crie um projeto em https://supabase.com/dashboard
2. Copie `.env.local.example` para `.env.local` e preencha com os valores
   de Settings → API do seu projeto Supabase.
3. Instale as dependências:
   ```bash
   npm install
   ```
4. Aplique as migrations no seu projeto Supabase:
   ```bash
   npx supabase link --project-ref <seu-project-ref>
   npx supabase db push
   ```
5. Gere os tipos reais do banco (substitui o arquivo escrito manualmente):
   ```bash
   npx supabase gen types typescript --linked > lib/supabase/database.types.ts
   ```
6. Rode o projeto:
   ```bash
   npm run dev
   ```

## Estrutura

```
app/(admin)/login/           Login do admin (Server Action + Client Component do form).
app/(admin)/dashboard/        Área protegida (checagem de sessão + admin_users no servidor).
app/(admin)/actions.ts        Server Action de logout, compartilhada no route group.
components/ui/                Componentes shadcn/ui.
lib/supabase/
  client.ts                   Client Supabase p/ Client Components (anon key).
  server.ts                   Client Supabase p/ Server Components/Actions (anon key + cookies de sessão).
  admin.ts                    Client Supabase com service role — bypass de RLS.
                               Uso restrito: apenas onde não há sessão de usuário
                               (ex.: cliente público criando agendamento). Todo
                               código que usa este client valida manualmente
                               tudo que a RLS validaria.
  middleware.ts                Helper de renovação de sessão, chamado por proxy.ts.
  database.types.ts            Tipos gerados a partir do schema do banco.
lib/validations/               Schemas zod — fonte única de verdade da validação de input.
proxy.ts                       Middleware do Next.js 16 (renovação de sessão + redirect de borda para /dashboard sem login).
supabase/migrations/           Migrations SQL (schema + RLS).
supabase/test/                  Scripts usados para validar as migrations localmente
                               (isolamento de tenant + concorrência). Não fazem parte
                               do deploy — servem de documentação/regressão manual.
```

## Comandos úteis

```bash
npm run dev        # servidor de desenvolvimento
npm run build       # build de produção
npx tsc --noEmit    # typecheck
npx eslint .        # lint
```

## Como criar o primeiro admin

Não existe self-signup por decisão de arquitetura (não há policy de INSERT
em `admin_users` — provisionamento é manual). Para criar o primeiro admin:

1. No Supabase Dashboard → Authentication → Users → **Add user**, crie o
   usuário com e-mail e senha.
2. Copie o `id` (UUID) do usuário criado.
3. No SQL Editor do Supabase, rode:
   ```sql
   insert into public.admin_users (id, salon_id, role, name)
   values (
     '<uuid-do-usuario-criado>',
     '<uuid-do-salao>',
     'owner',
     'Nome do Admin'
   );
   ```
   (o salão em si também precisa existir em `public.salons` — crie via
   INSERT direto por enquanto; um CRUD de salões está fora do escopo do MVP.)
4. Faça login em `/login` com o e-mail e senha criados no passo 1.

## Decisões de arquitetura já tomadas (ver commits/migrations para detalhes)

- Multi-tenant via `salon_id` em toda tabela relevante + RLS habilitada em
  100% das tabelas desde a primeira migration.
- Cliente público (sem login) só tem SELECT liberado via RLS, e só nas
  colunas necessárias para montar a UI de agendamento. A escrita do
  agendamento acontece via Server Action com o client `admin.ts`, que faz
  toda a validação de negócio manualmente antes de gravar.
- Double booking é impedido no nível do banco por uma `EXCLUDE` constraint
  (`no_overlapping_appointments`), testada sob concorrência real — não
  depende de lock aplicacional.
- Timezone do salão fica em `salons.timezone`; tudo gravado em UTC
  (`timestamptz`).
- Login do admin é e-mail/senha via Supabase Auth. Sem self-signup: o
  primeiro admin de cada salão é provisionado manualmente (ver seção acima).
- Rota `/dashboard` é protegida em duas camadas: redirect de borda no
  `proxy.ts` (UX) e checagem definitiva de sessão + vínculo `admin_users`
  no `layout.tsx` do servidor (autorização real).
