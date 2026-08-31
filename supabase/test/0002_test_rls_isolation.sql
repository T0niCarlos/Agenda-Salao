\echo '--- TESTE 1: anon consegue ver profissionais/serviços ATIVOS de ambos os salões (dado público) ---'
set role anon;
select slug from public.salons order by slug;
select name from public.professionals order by name;
select name from public.services order by name;
reset role;

\echo '--- TESTE 2: admin do Salão A NAO deve ver profissionais do Salão B ---'
set role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select name, salon_id from public.professionals order by name;
\echo '(esperado: apenas Profissional A1)'

\echo '--- TESTE 3: admin do Salão A NAO deve ver clientes do Salão B ---'
select name, salon_id from public.clients order by name;
\echo '(esperado: apenas Cliente A)'

\echo '--- TESTE 4: admin do Salão A tenta inserir agendamento usando profissional do Salão B (deve falhar) ---'
insert into public.appointments (salon_id, professional_id, service_id, client_id, start_datetime, end_datetime, price_cents)
values (
  'aaaaaaaa-0000-0000-0000-000000000001',
  'bbbbbbbb-1111-0000-0000-000000000002', -- profissional do salão B
  'aaaaaaaa-2222-0000-0000-000000000001',
  'aaaaaaaa-3333-0000-0000-000000000001',
  now() + interval '1 day',
  now() + interval '1 day' + interval '1 hour',
  8000
);
\echo '(esperado: erro - RLS bloqueia pois professional_id não pertence ao salon_id do admin)'
reset role;
