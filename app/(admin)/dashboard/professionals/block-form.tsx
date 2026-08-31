"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { BlockFormState } from "./actions";

const initialState: BlockFormState = {};

export function BlockForm({
  action,
}: {
  action: (state: BlockFormState, formData: FormData) => Promise<BlockFormState>;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3" noValidate>
      <div className="flex flex-col gap-1">
        <Label htmlFor="start_datetime">Início</Label>
        <Input id="start_datetime" name="start_datetime" type="datetime-local" required />
        {state.fieldErrors?.start_datetime && (
          <p className="text-sm text-destructive">{state.fieldErrors.start_datetime}</p>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="end_datetime">Fim</Label>
        <Input id="end_datetime" name="end_datetime" type="datetime-local" required />
        {state.fieldErrors?.end_datetime && (
          <p className="text-sm text-destructive">{state.fieldErrors.end_datetime}</p>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="reason">Motivo (opcional)</Label>
        <Input id="reason" name="reason" className="w-48" />
      </div>
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Adicionando..." : "Bloquear"}
      </Button>
      {state.error && (
        <p role="alert" className="w-full text-sm text-destructive">
          {state.error}
        </p>
      )}
    </form>
  );
}
