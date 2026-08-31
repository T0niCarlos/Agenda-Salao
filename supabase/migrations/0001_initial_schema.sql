-- =========================================================================
-- 0001_initial_schema.sql
-- Schema inicial multi-tenant para a plataforma de agendamento de salões.
-- =========================================================================

-- ---------------------------------------------------------------------
-- Extensões
-- ---------------------------------------------------------------------
create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "btree_gist"; -- necessária para EXCLUDE USING gist com colunas =

-- ---------------------------------------------------------------------
-- Função utilitária: updated_at automático
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- salons
-- ---------------------------------------------------------------------
create table public.salons (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  timezone    text not null default 'America/Sao_Paulo',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint salons_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

create trigger trg_salons_updated_at
  before update on public.salons
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- admin_users (1:1 com auth.users, vínculo com o salão)
-- ---------------------------------------------------------------------
create table public.admin_users (
  id          uuid primary key references auth.users (id) on delete cascade,
  salon_id    uuid not null references public.salons (id) on delete cascade,
  role        text not null default 'admin' check (role in ('owner', 'admin')),
  name        text not null,
  created_at  timestamptz not null default now()
);

create index idx_admin_users_salon_id on public.admin_users (salon_id);

-- ---------------------------------------------------------------------
-- professionals
-- ---------------------------------------------------------------------
create table public.professionals (
  id          uuid primary key default gen_random_uuid(),
  salon_id    uuid not null references public.salons (id) on delete cascade,
  name        text not null,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_professionals_salon_id on public.professionals (salon_id);
create index idx_professionals_salon_active on public.professionals (salon_id, active);

create trigger trg_professionals_updated_at
  before update on public.professionals
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- services
-- ---------------------------------------------------------------------
create table public.services (
  id                uuid primary key default gen_random_uuid(),
  salon_id          uuid not null references public.salons (id) on delete cascade,
  name              text not null,
  duration_minutes  integer not null check (duration_minutes > 0),
  price_cents       integer not null default 0 check (price_cents >= 0),
  active            boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index idx_services_salon_id on public.services (salon_id);
create index idx_services_salon_active on public.services (salon_id, active);

create trigger trg_services_updated_at
  before update on public.services
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- professional_services (quais serviços cada profissional atende)
-- ---------------------------------------------------------------------
create table public.professional_services (
  salon_id          uuid not null references public.salons (id) on delete cascade,
  professional_id   uuid not null references public.professionals (id) on delete cascade,
  service_id        uuid not null references public.services (id) on delete cascade,
  created_at        timestamptz not null default now(),
  primary key (professional_id, service_id)
);

create index idx_prof_services_salon_id on public.professional_services (salon_id);
create index idx_prof_services_service_id on public.professional_services (service_id);

-- Defesa em profundidade: garante que profissional e serviço pertencem
-- ao MESMO salão informado na linha (mesmo que uma policy de RLS falhe
-- ou que o insert venha de código server-side com bug).
create or replace function public.check_professional_services_tenant()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1 from public.professionals
    where id = new.professional_id and salon_id = new.salon_id
  ) then
    raise exception 'professional % does not belong to salon %', new.professional_id, new.salon_id;
  end if;

  if not exists (
    select 1 from public.services
    where id = new.service_id and salon_id = new.salon_id
  ) then
    raise exception 'service % does not belong to salon %', new.service_id, new.salon_id;
  end if;

  return new;
end;
$$;

create trigger trg_professional_services_tenant
  before insert or update on public.professional_services
  for each row execute function public.check_professional_services_tenant();

-- ---------------------------------------------------------------------
-- working_hours (expediente recorrente por profissional/dia da semana)
-- ---------------------------------------------------------------------
create table public.working_hours (
  id                uuid primary key default gen_random_uuid(),
  salon_id          uuid not null references public.salons (id) on delete cascade,
  professional_id   uuid not null references public.professionals (id) on delete cascade,
  weekday           smallint not null check (weekday between 0 and 6), -- 0 = domingo
  start_time        time not null,
  end_time          time not null,
  created_at        timestamptz not null default now(),
  constraint working_hours_valid_range check (end_time > start_time)
);

create index idx_working_hours_salon_id on public.working_hours (salon_id);
create index idx_working_hours_prof_weekday on public.working_hours (professional_id, weekday);

create or replace function public.check_professional_tenant()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1 from public.professionals
    where id = new.professional_id and salon_id = new.salon_id
  ) then
    raise exception 'professional % does not belong to salon %', new.professional_id, new.salon_id;
  end if;
  return new;
end;
$$;

create trigger trg_working_hours_tenant
  before insert or update on public.working_hours
  for each row execute function public.check_professional_tenant();

-- ---------------------------------------------------------------------
-- blocks (folgas / bloqueios pontuais por profissional)
-- ---------------------------------------------------------------------
create table public.blocks (
  id                uuid primary key default gen_random_uuid(),
  salon_id          uuid not null references public.salons (id) on delete cascade,
  professional_id   uuid not null references public.professionals (id) on delete cascade,
  start_datetime    timestamptz not null,
  end_datetime      timestamptz not null,
  reason            text,
  created_at        timestamptz not null default now(),
  constraint blocks_valid_range check (end_datetime > start_datetime)
);

create index idx_blocks_salon_id on public.blocks (salon_id);
create index idx_blocks_professional_id on public.blocks (professional_id);
create index idx_blocks_range on public.blocks using gist (professional_id, tstzrange(start_datetime, end_datetime, '[)'));

create trigger trg_blocks_tenant
  before insert or update on public.blocks
  for each row execute function public.check_professional_tenant();

-- ---------------------------------------------------------------------
-- clients (sem login; criado/reaproveitado no momento do agendamento)
-- ---------------------------------------------------------------------
create table public.clients (
  id          uuid primary key default gen_random_uuid(),
  salon_id    uuid not null references public.salons (id) on delete cascade,
  name        text not null,
  whatsapp    text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint clients_whatsapp_format check (whatsapp ~ '^[0-9]{10,15}$')
);

-- Um mesmo WhatsApp é o mesmo cliente dentro do salão (permite reaproveitar
-- o cadastro em agendamentos futuros sem duplicar).
create unique index uq_clients_salon_whatsapp on public.clients (salon_id, whatsapp);
create index idx_clients_salon_id on public.clients (salon_id);

create trigger trg_clients_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- appointments
-- ---------------------------------------------------------------------
create table public.appointments (
  id                uuid primary key default gen_random_uuid(),
  salon_id          uuid not null references public.salons (id) on delete cascade,
  professional_id   uuid not null references public.professionals (id),
  service_id        uuid not null references public.services (id),
  client_id         uuid not null references public.clients (id),
  start_datetime    timestamptz not null,
  end_datetime      timestamptz not null,
  status            text not null default 'confirmed'
                      check (status in ('confirmed', 'cancelled', 'completed', 'no_show')),
  price_cents       integer not null check (price_cents >= 0), -- snapshot calculado no servidor
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint appointments_valid_range check (end_datetime > start_datetime),
  -- período materializado, usado pela constraint de exclusão abaixo
  period tstzrange generated always as (tstzrange(start_datetime, end_datetime, '[)')) stored
);

create index idx_appointments_salon_id on public.appointments (salon_id);
create index idx_appointments_professional_start on public.appointments (professional_id, start_datetime);
create index idx_appointments_salon_start on public.appointments (salon_id, start_datetime);
create index idx_appointments_client_id on public.appointments (client_id);

create trigger trg_appointments_updated_at
  before update on public.appointments
  for each row execute function public.set_updated_at();

-- Defesa em profundidade: profissional, serviço e cliente do agendamento
-- devem pertencer ao mesmo salão da linha.
create or replace function public.check_appointment_tenant()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1 from public.professionals
    where id = new.professional_id and salon_id = new.salon_id
  ) then
    raise exception 'professional % does not belong to salon %', new.professional_id, new.salon_id;
  end if;

  if not exists (
    select 1 from public.services
    where id = new.service_id and salon_id = new.salon_id
  ) then
    raise exception 'service % does not belong to salon %', new.service_id, new.salon_id;
  end if;

  if not exists (
    select 1 from public.clients
    where id = new.client_id and salon_id = new.salon_id
  ) then
    raise exception 'client % does not belong to salon %', new.client_id, new.salon_id;
  end if;

  return new;
end;
$$;

create trigger trg_appointments_tenant
  before insert or update on public.appointments
  for each row execute function public.check_appointment_tenant();

-- ---------------------------------------------------------------------
-- REGRA CRÍTICA: impede double booking, inclusive sob concorrência.
-- 'cancelled' e 'no_show' liberam o horário; 'confirmed' e 'completed' o ocupam.
-- Esta constraint é avaliada de forma atômica pelo Postgres no momento do
-- commit da transação, portanto duas requisições simultâneas para o mesmo
-- profissional/horário jamais resultam em dois agendamentos válidos:
-- a segunda recebe um erro de violação (23P01) que o backend traduz em
-- "horário indisponível".
-- ---------------------------------------------------------------------
alter table public.appointments
  add constraint no_overlapping_appointments
  exclude using gist (
    professional_id with =,
    period with &&
  )
  where (status not in ('cancelled', 'no_show'));
