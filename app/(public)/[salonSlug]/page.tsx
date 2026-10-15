import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { dateStrInTimeZone } from "@/lib/booking/availability";

import { BookingWizard } from "./booking-wizard";

export const dynamic = "force-dynamic";

export default async function SalonPublicPage({
  params,
}: {
  params: Promise<{ salonSlug: string }>;
}) {
  const { salonSlug } = await params;
  const supabase = await createClient();

  const { data: salon } = await supabase
    .from("salons")
    .select("id, name, timezone")
    .eq("slug", salonSlug)
    .maybeSingle();

  if (!salon) notFound();

  const { data: services } = await supabase
    .from("services")
    .select("id, name, duration_minutes, price_cents")
    .eq("active", true)
    .order("name");

  const todayStr = dateStrInTimeZone(new Date(), salon.timezone);

  return (
    <div className="min-h-screen bg-[#faf7f8] text-[#2d1e2b] antialiased">
      {/* 🪷 CABEÇALHO ELEGANTE IDÊNTICO À IMAGEM */}
      <header className="bg-white/90 backdrop-blur-md sticky top-0 z-20 border-b border-[#f0e7ee] px-5 py-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="w-6" />
          
          <div className="flex flex-col items-center text-center">
            {/* Flor de Lótus */}
            <svg
              className="w-7 h-7 text-[#9f799d] mb-1"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path
                d="M12 3c-1.5 3-4 6-4 9 0 2.2 1.8 4 4 4s4-1.8 4-4c0-3-2.5-6-4-9z"
                opacity="0.9"
              />
              <path
                d="M7 8c-1.5 2.5-3 5-3 7.5 0 2 1.5 3.5 3.5 3.5 1.5 0 2.5-.8 3.5-2-1.5-1.5-3-4.5-4-9z"
                opacity="0.6"
              />
              <path
                d="M17 8c1.5 2.5 3 5 3 7.5 0 2-1.5 3.5-3.5 3.5-1.5 0-2.5-.8-3.5-2 1.5-1.5 3-4.5 4-9z"
                opacity="0.6"
              />
            </svg>
            <h1 className="text-2xl font-serif tracking-wide text-[#352333] font-medium leading-none">
              Aline Lyra
            </h1>
            <p className="text-[9px] tracking-[0.25em] text-[#8e7489] uppercase font-semibold mt-1">
              BELEZA E AUTOESTIMA
            </p>
          </div>

          {/* Menu */}
          <div className="w-6 flex flex-col gap-1 items-end cursor-pointer">
            <span className="w-5 h-0.5 bg-[#422e40] rounded-full" />
            <span className="w-4 h-0.5 bg-[#422e40] rounded-full" />
            <span className="w-3 h-0.5 bg-[#422e40] rounded-full" />
          </div>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL (FORMATO SMARTPHONE DA IMAGEM) */}
      <main className="max-w-md mx-auto p-4 sm:p-5 flex flex-col pb-12">
        {/* 👁️ BANNER HERO COM FOTO PROFISSIONAL */}
        <div className="relative rounded-3xl overflow-hidden h-48 sm:h-52 shadow-md mb-6 border border-white">
          <img
            src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=900&q=80"
            alt="Aline Lyra - Realce o que te faz única"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#2a1728]/85 via-[#2a1728]/35 to-transparent flex flex-col justify-end p-5 text-white">
            <h2 className="text-2xl font-serif font-medium tracking-wide leading-tight">
              Realce o que
              <br />
              te faz única
            </h2>
            <p className="text-xs text-white/80 tracking-wider font-light mt-1.5">
              Cílios · Cabelo · Sobrancelhas
            </p>
          </div>
        </div>

        {/* WIZARD DE AGENDAMENTO ESTILIZADO */}
        <BookingWizard
          salonSlug={salonSlug}
          services={services ?? []}
          todayStr={todayStr}
        />
      </main>
    </div>
  );
}
