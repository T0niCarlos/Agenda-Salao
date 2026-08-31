-- Dados de teste: dois salões distintos, para validar isolamento de tenant.
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'admin.salaoa@teste.com'),
  ('22222222-2222-2222-2222-222222222222', 'admin.salaob@teste.com');

insert into public.salons (id, slug, name, timezone) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'salao-a', 'Salão A', 'America/Sao_Paulo'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'salao-b', 'Salão B', 'America/Sao_Paulo');

insert into public.admin_users (id, salon_id, role, name) values
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000001', 'owner', 'Admin Salão A'),
  ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-0000-0000-0000-000000000002', 'owner', 'Admin Salão B');

insert into public.professionals (id, salon_id, name, active) values
  ('aaaaaaaa-1111-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Profissional A1', true),
  ('bbbbbbbb-1111-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000002', 'Profissional B1', true);

insert into public.services (id, salon_id, name, duration_minutes, price_cents, active) values
  ('aaaaaaaa-2222-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Corte A', 60, 8000, true),
  ('bbbbbbbb-2222-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000002', 'Corte B', 60, 9000, true);

insert into public.professional_services (salon_id, professional_id, service_id) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-1111-0000-0000-000000000001', 'aaaaaaaa-2222-0000-0000-000000000001'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'bbbbbbbb-1111-0000-0000-000000000002', 'bbbbbbbb-2222-0000-0000-000000000002');

insert into public.clients (id, salon_id, name, whatsapp) values
  ('aaaaaaaa-3333-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Cliente A', '11999990001'),
  ('bbbbbbbb-3333-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000002', 'Cliente B', '11999990002');
