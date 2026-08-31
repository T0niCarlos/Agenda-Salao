import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentAdmin } from "@/lib/auth/get-current-admin";

import { toggleServiceActive } from "./actions";

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default async function ServicesPage() {
  const { supabase } = await getCurrentAdmin();

  const { data: services, error } = await supabase
    .from("services")
    .select("id, name, duration_minutes, price_cents, active")
    .order("name");

  if (error) {
    throw new Error("Não foi possível carregar os serviços.");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Serviços</h1>
        <Button asChild size="sm">
          <Link href="/dashboard/services/new">Novo serviço</Link>
        </Button>
      </div>

      {services.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Nenhum serviço cadastrado</CardTitle>
            <CardDescription>
              Cadastre o primeiro serviço para começar a montar a agenda do
              salão.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="sm">
              <Link href="/dashboard/services/new">Cadastrar serviço</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {services.map((service) => (
            <Card key={service.id}>
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">
                    {service.name}
                    {!service.active && (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        (inativo)
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {service.duration_minutes} min ·{" "}
                    {formatPrice(service.price_cents)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/dashboard/services/${service.id}/edit`}>
                      Editar
                    </Link>
                  </Button>
                  <form
                    action={toggleServiceActive.bind(
                      null,
                      service.id,
                      !service.active
                    )}
                  >
                    <Button type="submit" variant="ghost" size="sm">
                      {service.active ? "Desativar" : "Ativar"}
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
