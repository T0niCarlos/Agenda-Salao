"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { WEEKDAY_LABELS } from "@/lib/validations/working-hours";

import type { WorkingHourFormState } from "./actions";

const initialState: WorkingHourFormState = {};

export function WorkingHourForm({
  action,
}: {
  action: (state: WorkingHourFormState, formData: FormData) => Promise<WorkingHourFormState>;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3" noValidate>
      <div className="flex flex-col gap-1">
        <Label htmlFor="weekday">Dia</Label>
        <NativeSelect id="weekday" name="weekday" defaultValue="1" className="w-40">
          {WEEKDAY_LABELS.map((label, index) => (
            <option key={label} value={index}>
              {label}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="start_time">Início</Label>
        <Input id="start_time" name="start_time" type="time" required className="w-28" />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="end_time">Fim</Label>
        <Input id="end_time" name="end_time" type="time" required className="w-28" />
      </div>
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Adicionando..." : "Adicionar"}
      </Button>
      {(state.error || state.fieldErrors) && (
        <p role="alert" className="w-full text-sm text-destructive">
          {state.error ??
            state.fieldErrors?.weekday ??
            state.fieldErrors?.start_time ??
            state.fieldErrors?.end_time}
        </p>
      )}
    </form>
  );
}
