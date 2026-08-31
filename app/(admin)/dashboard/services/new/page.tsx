import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { createService } from "../actions";
import { ServiceForm } from "../service-form";

export default function NewServicePage() {
  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Novo serviço</CardTitle>
      </CardHeader>
      <CardContent>
        <ServiceForm action={createService} submitLabel="Criar serviço" />
      </CardContent>
    </Card>
  );
}
