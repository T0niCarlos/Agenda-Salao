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

import { toggleProfessionalActive } from "./actions";

export default async function ProfessionalsPage() {
  const { supabase } = await getCurrentAdmin();

  const { data: professionals, error } = await supabase
    .from("professionals")
    .select("id, name, active")
    .order("name");

  if (error) {
    throw new Error("Não foi possível carregar os profissionais.");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Profissionais</h1>
        <Button asChild size="sm">
          <Link href="/dashboard/professionals/new">Novo profissional</Link>
        </Button>
      </div>

      {professionals.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Nenhum profissional cadastrado</CardTitle>
            <CardDescription>
              Cadastre o primeiro profissional para configurar horários e
              serviços atendidos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="sm">
              <Link href="/dashboard/professionals/new">
                Cadastrar profissional
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {professionals.map((professional) => (
            <Card key={professional.id}>
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-medium">
                  {professional.name}
                  {!professional.active && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      (inativo)
                    </span>
                  )}
                </p>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/dashboard/professionals/${professional.id}`}>
                      Gerenciar
                    </Link>
                  </Button>
                  <form
                    action={toggleProfessionalActive.bind(
                      null,
                      professional.id,
                      !professional.active
                    )}
                  >
                    <Button type="submit" variant="ghost" size="sm">
                      {professional.active ? "Desativar" : "Ativar"}
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
