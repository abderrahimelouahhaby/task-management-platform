"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { ColorPicker } from "@/components/shared/color-picker";
import { FieldError } from "@/components/shared/field-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LABEL_COLORS } from "../constants";
import { useCreateLabel, useUpdateLabel } from "../hooks";
import { createLabelSchema, type CreateLabelInput } from "../schemas";
import type { LabelDto } from "../types";

type LabelFormProps = {
  workspaceId: string;
  label?: LabelDto | null;
  onDone?: () => void;
};

export function LabelForm({ workspaceId, label, onDone }: LabelFormProps) {
  const createLabel = useCreateLabel(workspaceId);
  const updateLabel = useUpdateLabel(workspaceId);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateLabelInput>({
    resolver: zodResolver(createLabelSchema),
    defaultValues: {
      name: label?.name ?? "",
      color: label?.color ?? LABEL_COLORS[0],
    },
  });

  const isPending = createLabel.isPending || updateLabel.isPending;

  function onSubmit(values: CreateLabelInput) {
    if (label) {
      updateLabel.mutate({ labelId: label.id, input: values }, { onSuccess: () => onDone?.() });
    } else {
      createLabel.mutate(values, {
        onSuccess: () => {
          reset({ name: "", color: values.color });
          onDone?.();
        },
      });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`label-name-${label?.id ?? "new"}`}>Name</Label>
        <Input
          id={`label-name-${label?.id ?? "new"}`}
          autoComplete="off"
          placeholder="Bug"
          aria-invalid={Boolean(errors.name)}
          {...register("name")}
        />
        <FieldError message={errors.name?.message} />
      </div>

      <div className="space-y-2">
        <Label>Color</Label>
        <Controller
          control={control}
          name="color"
          render={({ field }) => (
            <ColorPicker
              value={field.value}
              onChange={field.onChange}
              colors={LABEL_COLORS}
              label="Label color"
            />
          )}
        />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
        {label ? "Save changes" : "Create label"}
      </Button>
    </form>
  );
}
