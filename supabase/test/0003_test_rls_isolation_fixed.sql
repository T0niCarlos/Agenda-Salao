\echo '--- TESTE 2 (corrigido): admin do Salao A NAO deve ver profissionais do Salao B ---'
begin;
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select name, salon_id from public.professionals order by name;
\echo '(esperado: apenas Profissional A1)'
commit;

\echo '--- TESTE 3 (corrigido): admin do Salao A NAO deve ver clientes do Salao B ---'
begin;
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select name, salon_id from public.clients order by name;
\echo '(esperado: apenas Cliente A)'
commit;

\echo '--- TESTE 5: admin do Salao A tenta inserir agendamento com salon_id do Salao B (RLS deve bloquear) ---'
begin;
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
insert into public.appointments (salon_id, professional_id, service_id, client_id, start_datetime, end_datetime, price_cents)
values (
  'bbbbbbbb-0000-0000-0000-000000000002', -- salon_id de outro salao
  'bbbbbbbb-1111-0000-0000-000000000002',
  'bbbbbbbb-2222-0000-0000-000000000002',
  'bbbbbbbb-3333-0000-0000-000000000002',
  now() + interval '2 day',
  now() + interval '2 day' + interval '1 hour',
  9000
);
\echo '(esperado: erro - RLS WITH CHECK bloqueia, salon_id != admin_salon_id())'
rollback;

\echo '--- TESTE 6: admin do Salao A cria agendamento valido dentro do proprio salao (deve funcionar) ---'
begin;
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
insert into public.appointments (salon_id, professional_id, service_id, client_id, start_datetime, end_datetime, price_cents)
values (
  'aaaaaaaa-0000-0000-0000-000000000001',
  'aaaaaaaa-1111-0000-0000-000000000001',
  'aaaaaaaa-2222-0000-0000-000000000001',
  'aaaaaaaa-3333-0000-0000-000000000001',
  now() + interval '3 day',
  now() + interval '3 day' + interval '1 hour',
  8000
);
select count(*) as total_agendamentos_visiveis from public.appointments;
\echo '(esperado: INSERT 0 1, e a linha visivel para o proprio admin)'
commit;
