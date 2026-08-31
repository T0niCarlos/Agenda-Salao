"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Algo deu errado</CardTitle>
        <CardDescription>
          Não foi possível carregar esta página. Tente novamente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={reset}>Tentar de novo</Button>
      </CardContent>
    </Card>
  );
}
