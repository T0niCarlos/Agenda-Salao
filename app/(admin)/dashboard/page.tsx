import { revalidatePath } from "next/cache";
import { getCurrentAdmin } from "@/lib/auth/get-current-admin";

export const dynamic = "force-dynamic";

type AppointmentItem = {
  id: string;
  start_datetime: string;
  price_cents: number;
  status: "confirmed" | "completed" | "cancelled" | "no_show";
  services: { name?: string } | null;
  clients: { name?: string; whatsapp?: string } | null;
};

export default async function DashboardMainPage() {
  // Ações do Servidor Integradas (Sem precisar de arquivo actions.ts separado!)
  async function updateStatus(
    appointmentId: string,
    status: "confirmed" | "completed" | "cancelled" | "no_show"
  ) {
    "use server";
    const { supabase, admin } = await getCurrentAdmin();
    await supabase
      .from("appointments")
      .update({ status })
      .eq("id", appointmentId)
      .eq("salon_id", admin.salonId);
    revalidatePath("/dashboard");
  }

  async function deleteAppointment(appointmentId: string) {
    "use server";
    const { supabase, admin } = await getCurrentAdmin();
    await supabase
      .from("appointments")
      .delete()
      .eq("id", appointmentId)
      .eq("salon_id", admin.salonId);
    revalidatePath("/dashboard");
  }

  async function createQuickService(formData: FormData) {
    "use server";
    const { supabase, admin } = await getCurrentAdmin();
    const name = formData.get("name") as string;
    const duration = parseInt(formData.get("duration") as string, 10) || 45;
    const priceRaw = (formData.get("price") as string) || "0";
    const priceReais = parseFloat(priceRaw.replace(",", ".")) || 0;

    if (name && priceReais > 0) {
      await supabase.from("services").insert({
        salon_id: admin.salonId,
        name,
        duration_minutes: duration,
        price_cents: Math.round(priceReais * 100),
        active: true,
      });
      revalidatePath("/dashboard");
    }
  }

  const { supabase, admin } = await getCurrentAdmin();

  // Buscar todos os agendamentos do salão
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

  // Cálculos do mês
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const thisMonthApps = list.filter((app) => {
    const d = new Date(app.start_datetime);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalGanhoCents = thisMonthApps
    .filter((a) => a.status === "completed")
    .reduce((acc, a) => acc + (a.price_cents || 0), 0);

  const aReceberCents = thisMonthApps
    .filter((a) => a.status === "confirmed")
    .reduce((acc, a) => acc + (a.price_cents || 0), 0);

  const totalAtendidas = thisMonthApps.filter((a) => a.status === "completed").length;

  const ticketMedioCents =
    totalAtendidas > 0 ? Math.round(totalGanhoCents / totalAtendidas) : 0;

  const formatMoney = (cents: number) =>
    (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="min-h-screen bg-pink-50/40 p-4 sm:p-6 lg:p-8 flex flex-col gap-8 max-w-7xl mx-auto">
      {/* 🌸 TOPO: OS 4 CARDS DE FATURAMENTO */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 font-serif flex items-center gap-2">
              Painel de Gestão · Aline Lyra
            </h1>
            <p className="text-sm text-pink-500 font-medium">
              Controle financeiro e atendimento em tempo real
            </p>
          </div>
          <a
            href="/aline-lyra"
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-sm font-medium shadow-md shadow-pink-200 transition"
          >
            Ver Agenda da Cliente ↗
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Ganho */}
          <div className="bg-white p-5 rounded-2xl border border-pink-100 shadow-sm shadow-pink-100/50 flex flex-col justify-between">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-full w-fit">
              💰 Total Ganho (Mês)
            </span>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-3">
              {formatMoney(totalGanhoCents)}
            </p>
            <p className="text-xs text-slate-400 mt-1">Atendimentos finalizados</p>
          </div>

          {/* Card 2: A Receber */}
          <div className="bg-white p-5 rounded-2xl border border-pink-100 shadow-sm shadow-pink-100/50 flex flex-col justify-between">
            <span className="text-xs font-semibold text-pink-600 uppercase tracking-wider bg-pink-50 px-2.5 py-1 rounded-full w-fit">
              ⏳ A Receber
            </span>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-3">
              {formatMoney(aReceberCents)}
            </p>
            <p className="text-xs text-slate-400 mt-1">Horários agendados a cumprir</p>
          </div>

          {/* Card 3: Clientes Atendidas */}
          <div className="bg-white p-5 rounded-2xl border border-pink-100 shadow-sm shadow-pink-100/50 flex flex-col justify-between">
            <span className="text-xs font-semibold text-purple-600 uppercase tracking-wider bg-purple-50 px-2.5 py-1 rounded-full w-fit">
              👥 Clientes Atendidas
            </span>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-3">
              {totalAtendidas}
            </p>
            <p className="text-xs text-slate-400 mt-1">Neste mês</p>
          </div>

          {/* Card 4: Ticket Médio */}
          <div className="bg-white p-5 rounded-2xl border border-pink-100 shadow-sm shadow-pink-100/50 flex flex-col justify-between">
            <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider bg-rose-50 px-2.5 py-1 rounded-full w-fit">
              💎 Ticket Médio
            </span>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-3">
              {formatMoney(ticketMedioCents)}
            </p>
            <p className="text-xs text-slate-400 mt-1">Média por atendimento</p>
          </div>
        </div>
      </div>

      {/* 📅 NO MEIO: OS AGENDAMENTOS COM AS 4 AÇÕES RÁPIDAS */}
      <div className="bg-white rounded-2xl border border-pink-100 shadow-sm p-5 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Agendamentos da Semana & Ações
            </h2>
            <p className="text-xs text-slate-500">
              Confirme presenças, finalize atendimentos ou exclua horários
            </p>
          </div>
          <span className="text-xs font-semibold text-pink-700 bg-pink-50 px-3 py-1.5 rounded-xl border border-pink-100">
            Total registrado: {list.length}
          </span>
        </div>

        {list.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            Nenhum agendamento registrado ainda.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {list.slice(0, 15).map((app) => {
              const client = app.clients;
              const service = app.services;
              const date = new Date(app.start_datetime);
              const cleanPhone = client?.whatsapp ? client.whatsapp.replace(/\D/g, "") : "";
              const message = encodeURIComponent(
                `Olá, ${client?.name || "tudo bem"}! Aqui é do Salão Aline Lyra. Gostaria de confirmar seu agendamento de ${service?.name || "serviço"} para ${date.toLocaleDateString("pt-BR")} às ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}.`
              );

              return (
                <div
                  key={app.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-pink-200 hover:bg-pink-50/20 transition gap-4 bg-white"
                >
                  {/* Dados da Cliente e Serviço */}
                  <div className="flex flex-col gap-1 min-w-[220px]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-base">
                        {client?.name || "Cliente"}
                      </span>
                      {/* Badge do Status */}
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          app.status === "completed"
                            ? "bg-emerald-100 text-emerald-700"
                            : app.status === "confirmed"
                            ? "bg-blue-100 text-blue-700"
                            : app.status === "cancelled"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {app.status === "completed"
                          ? "Finalizado"
                          : app.status === "confirmed"
                          ? "Confirmado"
                          : app.status === "cancelled"
                          ? "Cancelado"
                          : "Pendente"}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-pink-600">
                      {service?.name || "Serviço"} · {formatMoney(app.price_cents)}
                    </p>
                    <p className="text-xs text-slate-500">
                      📅 {date.toLocaleDateString("pt-BR")} às{" "}
                      {date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>

                  {/* OS 4 BOTÕES DE SUPER PODER */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* 🟢 Botão Confirmar */}
                    <form action={updateStatus.bind(null, app.id, "confirmed")}>
                      <button
                        type="submit"
                        title="Marcar como Confirmado"
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition"
                      >
                        🟢 Confirmar
                      </button>
                    </form>

                    {/* ✅ Botão Finalizar (Faturado) */}
                    <form action={updateStatus.bind(null, app.id, "completed")}>
                      <button
                        type="submit"
                        title="Marcar como Atendido e Faturado"
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition"
                      >
                        ✅ Finalizar
                      </button>
                    </form>

                    {/* 💬 Botão Chamar no WhatsApp */}
                    {cleanPhone ? (
                      <a
                        href={`https://wa.me/55${cleanPhone}?text=${message}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition flex items-center gap-1"
                      >
                        💬 WhatsApp
                      </a>
                    ) : (
                      <span className="text-xs text-slate-300">Sem Zap</span>
                    )}

                    {/* 🗑️ Botão Excluir (Apaga na hora) */}
                    <form action={deleteAppointment.bind(null, app.id)}>
                      <button
                        type="submit"
                        title="Excluir permanentemente do banco"
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition"
                      >
                        🗑️ Excluir
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ➕ EMBAIXO: ADICIONAR NOVO SERVIÇO EM 2 CLIQUES */}
      <div className="bg-white rounded-2xl border border-pink-100 shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-1">
          ➕ Adicionar Novo Serviço
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Cadastre novos procedimentos no catálogo da Aline Lyra imediatamente
        </p>

        <form action={createQuickService} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-600">Nome do Serviço</label>
            <input
              type="text"
              name="name"
              required
              placeholder="Ex: Escova Modelada"
              className="w-full mt-1 px-3 py-2 text-sm rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-400 bg-pink-50/20"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">Duração (minutos)</label>
            <input
              type="number"
              name="duration"
              required
              defaultValue={45}
              className="w-full mt-1 px-3 py-2 text-sm rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-400 bg-pink-50/20"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">Preço (R$)</label>
            <input
              type="text"
              name="price"
              required
              placeholder="Ex: 85,00"
              className="w-full mt-1 px-3 py-2 text-sm rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-400 bg-pink-50/20"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-pink-200 transition"
            >
              Salvar Serviço
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
