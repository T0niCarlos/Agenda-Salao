"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { ServiceFormState } from "./actions";

const initialState: ServiceFormState = {};

export function ServiceForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (state: ServiceFormState, formData: FormData) => Promise<ServiceFormState>;
  defaultValues?: { name: string; duration_minutes: number; price_reais: number };
  submitLabel: string;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nome do serviço</Label>
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

      <div className="flex flex-col gap-2">
        <Label htmlFor="duration_minutes">Duração (minutos)</Label>
        <Input
          id="duration_minutes"
          name="duration_minutes"
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          required
          defaultValue={defaultValues?.duration_minutes}
          aria-invalid={Boolean(state.fieldErrors?.duration_minutes)}
          aria-describedby={
            state.fieldErrors?.duration_minutes ? "duration-error" : undefined
          }
        />
        {state.fieldErrors?.duration_minutes && (
          <p id="duration-error" className="text-sm text-destructive">
            {state.fieldErrors.duration_minutes}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="price_reais">Preço (R$)</Label>
        <Input
          id="price_reais"
          name="price_reais"
          type="number"
          min={0}
          step="0.01"
          inputMode="decimal"
          required
          defaultValue={defaultValues?.price_reais}
          aria-invalid={Boolean(state.fieldErrors?.price_reais)}
          aria-describedby={state.fieldErrors?.price_reais ? "price-error" : undefined}
        />
        {state.fieldErrors?.price_reais && (
          <p id="price-error" className="text-sm text-destructive">
            {state.fieldErrors.price_reais}
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
