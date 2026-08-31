import { notFound } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCurrentAdmin } from "@/lib/auth/get-current-admin";

import { updateClient } from "../../actions";

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await getCurrentAdmin();
  const { data: client } = await supabase
    .from("clients")
    .select("id, name, whatsapp")
    .eq("id", id)
    .maybeSingle();

  if (!client) notFound();

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Editar cliente</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={updateClient.bind(null, client.id)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" defaultValue={client.name} required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input id="whatsapp" name="whatsapp" defaultValue={client.whatsapp} required />
          </div>
          <Button type="submit">Salvar</Button>
        </form>
      </CardContent>
    </Card>
  );
}
