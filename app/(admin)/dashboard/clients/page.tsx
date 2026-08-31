import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentAdmin } from "@/lib/auth/get-current-admin";

export default async function ClientsPage() {
  const { supabase } = await getCurrentAdmin();
  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, whatsapp")
    .order("name");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Clientes</h1>
      {!clients || clients.length === 0 ? (
        <Card>
          <CardContent className="text-sm text-muted-foreground">
            Nenhum cliente cadastrado ainda — clientes são criados automaticamente no
            primeiro agendamento.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {clients.map((client) => (
            <Card key={client.id}>
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{client.name}</p>
                  <p className="text-sm text-muted-foreground">{client.whatsapp}</p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/dashboard/clients/${client.id}/edit`}>Editar</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
