import { notFound } from "next/navigation";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentAdmin } from "@/lib/auth/get-current-admin";

import { updateService } from "../../actions";
import { ServiceForm } from "../../service-form";

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await getCurrentAdmin();

  const { data: service } = await supabase
    .from("services")
    .select("id, name, duration_minutes, price_cents")
    .eq("id", id)
    .maybeSingle();

  if (!service) {
    notFound();
  }

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Editar serviço</CardTitle>
      </CardHeader>
      <CardContent>
        <ServiceForm
          action={updateService.bind(null, service.id)}
          defaultValues={{
            name: service.name,
            duration_minutes: service.duration_minutes,
            price_reais: service.price_cents / 100,
          }}
          submitLabel="Salvar alterações"
        />
      </CardContent>
    </Card>
  );
}
