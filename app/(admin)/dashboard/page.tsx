import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bem-vindo(a) de volta</CardTitle>
        <CardDescription>
          Login funcionando. Agenda, serviços, profissionais, horários e
          bloqueios entram nas próximas etapas.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
