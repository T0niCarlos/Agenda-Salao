import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { dateStrInTimeZone } from "@/lib/booking/availability";

import { BookingWizard } from "./booking-wizard";

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
    <div className="min-h-screen bg-pink-50 text-slate-800">
      {/* Header com tom pastel de rosa e sombra sutil */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-10 border-b border-pink-100 p-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-pink-600 font-serif">
          {salon.name}
        </h1>
        <p className="text-sm text-pink-400 mt-1">Agendamento Online</p>
      </header>

      <main className="mx-auto flex max-w-xl flex-col gap-6 p-4 pt-8">
        <div className="bg-white rounded-2xl shadow-xl shadow-pink-100/50 p-6 sm:p-8 border border-pink-50">
          <BookingWizard salonSlug={salonSlug} services={services ?? []} todayStr={todayStr} />
        </div>
      </main>
    </div>
  );
}
