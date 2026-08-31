import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentAdmin } from "@/lib/auth/get-current-admin";
import { dateStrInTimeZone } from "@/lib/booking/availability";

import { ManualBookingForm } from "../manual-booking-form";

export default async function NewAppointmentPage() {
  const { supabase, admin } = await getCurrentAdmin();
  const [{ data: services }, { data: professionals }, { data: salon }] = await Promise.all([
    supabase.from("services").select("id, name").eq("active", true).order("name"),
    supabase.from("professionals").select("id, name").eq("active", true).order("name"),
    supabase.from("salons").select("timezone").eq("id", admin.salonId).maybeSingle(),
  ]);

  const todayStr = dateStrInTimeZone(new Date(), salon?.timezone ?? "America/Sao_Paulo");

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Novo agendamento</CardTitle>
      </CardHeader>
      <CardContent>
        <ManualBookingForm
          services={services ?? []}
          professionals={professionals ?? []}
          todayStr={todayStr}
        />
      </CardContent>
    </Card>
  );
}
