import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { createProfessional } from "../actions";
import { ProfessionalForm } from "../professional-form";

export default function NewProfessionalPage() {
  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Novo profissional</CardTitle>
      </CardHeader>
      <CardContent>
        <ProfessionalForm action={createProfessional} submitLabel="Criar profissional" />
      </CardContent>
    </Card>
  );
}
