"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { ProfessionalFormState } from "./actions";

const initialState: ProfessionalFormState = {};

export function ProfessionalForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (state: ProfessionalFormState, formData: FormData) => Promise<ProfessionalFormState>;
  defaultValues?: { name: string };
  submitLabel: string;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nome do profissional</Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={defaultValues?.name}
          aria-invalid={Boolean(state.fieldErrors?.name)}
          aria-describedby={state.fieldErrors?.name ? "name-error" : undefined}
        />
        {state.fieldErrors?.name && (
          <p id="name-error" className="text-sm text-destructive">
            {state.fieldErrors.name}
          </p>
        )}
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Salvando..." : submitLabel}
      </Button>
    </form>
  );
}
