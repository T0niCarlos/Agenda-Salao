#!/usr/bin/env bash
set -euo pipefail
export PGPASSWORD=postgres
CONN="psql -U postgres -h localhost -d salon_test -v ON_ERROR_STOP=1"

# Duas transações concorrentes: ambas tentam agendar o MESMO profissional
# no MESMO horário (14:00-15:00 de amanhã), cada uma para um cliente diferente.
# Usamos advisory coordination via arquivos + sleep para garantir overlap real
# entre BEGIN e INSERT das duas sessões.

cat > /tmp/tx1.sql <<'SQL'
begin;
select pg_sleep(1); -- garante que as duas transações fiquem "em voo" ao mesmo tempo
insert into public.appointments (salon_id, professional_id, service_id, client_id, start_datetime, end_datetime, price_cents)
values (
  'aaaaaaaa-0000-0000-0000-000000000001',
  'aaaaaaaa-1111-0000-0000-000000000001',
  'aaaaaaaa-2222-0000-0000-000000000001',
  'aaaaaaaa-3333-0000-0000-000000000001',
  (current_date + interval '10 day' + interval '14 hour'),
  (current_date + interval '10 day' + interval '15 hour'),
  8000
);
commit;
SQL

cp /tmp/tx1.sql /tmp/tx2.sql

# dispara as duas em paralelo, como conexões (sessões) distintas de verdade
( $CONN -f /tmp/tx1.sql > /tmp/tx1_out.log 2>&1; echo "TX1_EXIT=$?" >> /tmp/tx1_out.log ) &
PID1=$!
( $CONN -f /tmp/tx2.sql > /tmp/tx2_out.log 2>&1; echo "TX2_EXIT=$?" >> /tmp/tx2_out.log ) &
PID2=$!

wait $PID1
wait $PID2

echo "===== SAIDA TX1 ====="
cat /tmp/tx1_out.log
echo "===== SAIDA TX2 ====="
cat /tmp/tx2_out.log

echo "===== AGENDAMENTOS GRAVADOS PARA O HORARIO DISPUTADO ====="
$CONN -c "select id, professional_id, start_datetime, status from public.appointments where start_datetime = (current_date + interval '10 day' + interval '14 hour');"
