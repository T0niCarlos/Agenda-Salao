import Link from "next/link";
import { getCurrentAdmin } from "@/lib/auth/get-current-admin";

export const dynamic = "force-dynamic";

type AppointmentItem = {
  id: string;
  start_datetime: string;
  price_cents: number;
  status: string;
  services: { name?: string } | null;
  clients: { name?: string; whatsapp?: string } | null;
};

export default async function FaturamentoPage() {
  const { supabase, admin } = await getCurrentAdmin();

  // Buscar todos os agendamentos do salão com serviços e clientes
  const { data: appointments } = await supabase
    .from("appointments")
    .select(`
      id,
      start_datetime,
      price_cents,
      status,
      services:service_id (name),
      clients:client_id (name, whatsapp)
    `)
    .eq("salon_id", admin.salonId)
    .order("start_datetime", { ascending: false });

  const list = (appointments || []) as unknown as AppointmentItem[];

  // Data atual para cálculo do mês
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Agendamentos deste mês
  const thisMonthApps = list.filter((app) => {
    const d = new Date(app.start_datetime);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  // Métricas do Mês
  const faturamentoRealizadoCents = thisMonthApps
    .filter((a) => a.status === "completed")
    .reduce((acc, a) => acc + (a.price_cents || 0), 0);

  const faturamentoPrevistoCents = thisMonthApps
    .filter((a) => a.status === "confirmed")
    .reduce((acc, a) => acc + (a.price_cents || 0), 0);

  const totalAtendimentosMes = thisMonthApps.filter((a) => a.status === "completed").length;
  const totalCanceladosMes = thisMonthApps.filter((a) => a.status === "cancelled").length;
  const totalFaltasMes = thisMonthApps.filter((a) => a.status === "no_show").length;

  const ticketMedioCents =
    totalAtendimentosMes > 0
      ? Math.round(faturamentoRealizadoCents / totalAtendimentosMes)
      : 0;

  // Ranking de Serviços mais lucrativos
  const serviceStats: Record<string, { count: number; totalCents: number }> = {};
  for (const a of thisMonthApps) {
    if (a.status !== "cancelled") {
      const name = a.services?.name || "Outro";
      if (!serviceStats[name]) serviceStats[name] = { count: 0, totalCents: 0 };
      serviceStats[name].count += 1;
      serviceStats[name].totalCents += a.price_cents || 0;
    }
  }

  const topServices = Object.entries(serviceStats)
    .sort((a, b) => b[1].totalCents - a[1].totalCents)
    .slice(0, 5);

  const formatMoney = (cents: number) =>
    (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="flex flex-col gap-8 p-6 max-w-6xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Faturamento & Métricas
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Acompanhe os ganhos e o desempenho do Salão Aline Lyra neste mês.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/agenda"
            className="px-4 py-2 rounded-lg border border-pink-200 text-pink-700 bg-pink-50 hover:bg-pink-100 font-medium text-sm transition"
          >
            ← Voltar para Agenda
          </Link>
        </div>
      </div>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Faturamento Realizado */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm shadow-pink-50">
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2 py-1 rounded">
            Recebido
          </span>
          <p className="text-2xl font-bold text-slate-900 mt-3">
            {formatMoney(faturamentoRealizadoCents)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {totalAtendimentosMes} atendimento(s) finalizado(s)
          </p>
        </div>

        {/* Card 2: Faturamento Previsto */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm shadow-pink-50">
          <span className="text-xs font-semibold text-pink-600 uppercase tracking-wider bg-pink-50 px-2 py-1 rounded">
            A Receber
          </span>
          <p className="text-2xl font-bold text-slate-900 mt-3">
            {formatMoney(faturamentoPrevistoCents)}
          </p>
          <p className="text-xs text-slate-500 mt-1">Horários confirmados no mês</p>
        </div>

        {/* Card 3: Ticket Médio */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm shadow-pink-50">
          <span className="text-xs font-semibold text-purple-600 uppercase tracking-wider bg-purple-50 px-2 py-1 rounded">
            Ticket Médio
          </span>
          <p className="text-2xl font-bold text-slate-900 mt-3">
            {formatMoney(ticketMedioCents)}
          </p>
          <p className="text-xs text-slate-500 mt-1">Média por cliente atendida</p>
        </div>

        {/* Card 4: Cancelamentos / Faltas */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm shadow-pink-50">
          <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider bg-amber-50 px-2 py-1 rounded">
            Cancelamentos / Faltas
          </span>
          <p className="text-2xl font-bold text-slate-900 mt-3">
            {totalCanceladosMes + totalFaltasMes}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {totalCanceladosMes} cancelados · {totalFaltasMes} faltas
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Serviços mais Lucrativos */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm col-span-1">
          <h2 className="text-lg font-bold text-slate-900 mb-4">
            🏆 Serviços Campeões de Receita
          </h2>
          {topServices.length === 0 ? (
            <p className="text-sm text-slate-400">Nenhum serviço registrado neste mês.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {topServices.map(([name, stat], idx) => (
                <div key={name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-pink-600 w-5">#{idx + 1}</span>
                    <span className="text-slate-700 font-medium">{name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">{formatMoney(stat.totalCents)}</p>
                    <p className="text-xs text-slate-400">{stat.count} atendimentos</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Próximos Atendimentos com Botão de WhatsApp */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm col-span-1 lg:col-span-2">
          <h2 className="text-lg font-bold text-slate-900 mb-4">
            📲 Ações Rápidas de Contato (WhatsApp)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-xs uppercase text-slate-400">
                <tr>
                  <th className="pb-3">Cliente</th>
                  <th className="pb-3">Serviço</th>
                  <th className="pb-3">Data / Hora</th>
                  <th className="pb-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {list.slice(0, 8).map((app) => {
                  const client = app.clients;
                  const service = app.services;
                  const date = new Date(app.start_datetime);
                  const cleanPhone = client?.whatsapp ? client.whatsapp.replace(/\D/g, "") : "";
                  const message = encodeURIComponent(
                    `Olá, ${client?.name || "tudo bem"}! Aqui é do Salão Aline Lyra. Gostaria de confirmar seu agendamento de ${service?.name || "serviço"} para ${date.toLocaleDateString("pt-BR")} às ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}.`
                  );

                  return (
                    <tr key={app.id} className="hover:bg-slate-50/50">
                      <td className="py-3 font-medium text-slate-800">{client?.name || "Cliente"}</td>
                      <td className="py-3 text-slate-600">{service?.name || "Serviço"}</td>
                      <td className="py-3 text-slate-500">
                        {date.toLocaleDateString("pt-BR")} às{" "}
                        {date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="py-3 text-right">
                        {cleanPhone ? (
                          <a
                            href={`https://wa.me/55${cleanPhone}?text=${message}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                          >
                            WhatsApp
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400">Sem telefone</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
