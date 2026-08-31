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
    <main className="mx-auto flex max-w-lg flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold">{salon.name}</h1>
      <BookingWizard salonSlug={salonSlug} services={services ?? []} todayStr={todayStr} />
    </main>
  );
}
