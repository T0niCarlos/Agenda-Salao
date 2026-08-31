-- =========================================================================
-- 0002_rls_policies.sql
-- Row Level Security: isolamento multi-tenant.
--
-- Modelo de acesso:
--   - anon (cliente público, sem login): apenas SELECT, e apenas nas
--     tabelas/colunas necessárias para montar o fluxo de agendamento
--     (salons, professionals ativos, services ativos, professional_services
--     de itens ativos). Nunca lê working_hours, blocks, clients ou
--     appointments diretamente.
--   - authenticated (admin do salão): CRUD completo, mas sempre restrito
--     ao próprio salon_id via admin_salon_id().
--   - A ESCRITA de agendamentos pelo cliente público NÃO passa por RLS
--     anônimo: acontece via Server Action/Route Handler usando a service
--     role, que executa toda a validação de negócio no servidor antes de
--     inserir. Por isso não existe policy de INSERT para anon em
--     appointments/clients.
-- =========================================================================

-- ---------------------------------------------------------------------
-- Helper: salon_id do admin autenticado atual.
-- SECURITY DEFINER evita reavaliação recursiva de RLS em admin_users
-- a cada policy que a utiliza.
-- ---------------------------------------------------------------------
create or replace function public.admin_salon_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select salon_id from public.admin_users where id = auth.uid()
$$;

grant execute on function public.admin_salon_id() to authenticated;

-- ---------------------------------------------------------------------
-- salons
-- ---------------------------------------------------------------------
alter table public.salons enable row level security;

create policy salons_public_select
  on public.salons for select
  to anon
  using (true);

create policy salons_admin_select
  on public.salons for select
  to authenticated
  using (id = public.admin_salon_id());

create policy salons_admin_update
  on public.salons for update
  to authenticated
  using (id = public.admin_salon_id())
  with check (id = public.admin_salon_id());

-- Sem policy de insert/delete: criação de salão é operação administrativa
-- feita via service role (fora do MVP de autoatendimento).

-- ---------------------------------------------------------------------
-- admin_users
-- ---------------------------------------------------------------------
alter table public.admin_users enable row level security;

create policy admin_users_self_select
  on public.admin_users for select
  to authenticated
  using (id = auth.uid());

-- Sem policy de insert/update/delete: provisionamento de admins é feito
-- via service role (fora do MVP de autoatendimento).

-- ---------------------------------------------------------------------
-- professionals
-- ---------------------------------------------------------------------
alter table public.professionals enable row level security;

create policy professionals_public_select
  on public.professionals for select
  to anon
  using (active = true);

create policy professionals_admin_all
  on public.professionals for all
  to authenticated
  using (salon_id = public.admin_salon_id())
  with check (salon_id = public.admin_salon_id());

-- ---------------------------------------------------------------------
-- services
-- ---------------------------------------------------------------------
alter table public.services enable row level security;

create policy services_public_select
  on public.services for select
  to anon
  using (active = true);

create policy services_admin_all
  on public.services for all
  to authenticated
  using (salon_id = public.admin_salon_id())
  with check (salon_id = public.admin_salon_id());

-- ---------------------------------------------------------------------
-- professional_services
-- ---------------------------------------------------------------------
alter table public.professional_services enable row level security;

create policy professional_services_public_select
  on public.professional_services for select
  to anon
  using (
    exists (
      select 1 from public.professionals p
      where p.id = professional_id and p.active = true
    )
    and exists (
      select 1 from public.services s
      where s.id = service_id and s.active = true
    )
  );

create policy professional_services_admin_all
  on public.professional_services for all
  to authenticated
  using (salon_id = public.admin_salon_id())
  with check (salon_id = public.admin_salon_id());

-- ---------------------------------------------------------------------
-- working_hours (somente admin; motor de disponibilidade usa service role)
-- ---------------------------------------------------------------------
alter table public.working_hours enable row level security;

create policy working_hours_admin_all
  on public.working_hours for all
  to authenticated
  using (salon_id = public.admin_salon_id())
  with check (salon_id = public.admin_salon_id());

-- ---------------------------------------------------------------------
-- blocks (somente admin; motor de disponibilidade usa service role)
-- ---------------------------------------------------------------------
alter table public.blocks enable row level security;

create policy blocks_admin_all
  on public.blocks for all
  to authenticated
  using (salon_id = public.admin_salon_id())
  with check (salon_id = public.admin_salon_id());

-- ---------------------------------------------------------------------
-- clients (somente admin; criação no booking público via service role)
-- ---------------------------------------------------------------------
alter table public.clients enable row level security;

create policy clients_admin_all
  on public.clients for all
  to authenticated
  using (salon_id = public.admin_salon_id())
  with check (salon_id = public.admin_salon_id());

-- ---------------------------------------------------------------------
-- appointments (somente admin; criação no booking público via service role)
-- ---------------------------------------------------------------------
alter table public.appointments enable row level security;

create policy appointments_admin_all
  on public.appointments for all
  to authenticated
  using (salon_id = public.admin_salon_id())
  with check (salon_id = public.admin_salon_id());
