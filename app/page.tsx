import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Plataforma de Agendamento</CardTitle>
          <CardDescription>
            Setup do projeto concluído. As páginas públicas e de admin serão
            implementadas nas próximas etapas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button disabled>Em construção</Button>
        </CardContent>
      </Card>
    </main>
  );
}
