"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FieldError } from "@/components/shared/field-error";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateWorkspace } from "../hooks";
import { createWorkspaceSchema, type CreateWorkspaceInput } from "../schemas";

type CreateWorkspaceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateWorkspaceDialog({ open, onOpenChange }: CreateWorkspaceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New team workspace</DialogTitle>
          <DialogDescription>
            A workspace groups projects and members. You will be its owner.
          </DialogDescription>
        </DialogHeader>
        <CreateWorkspaceForm onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function CreateWorkspaceForm({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const createWorkspace = useCreateWorkspace();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateWorkspaceInput>({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: { name: "" },
  });

  function onSubmit(values: CreateWorkspaceInput) {
    createWorkspace.mutate(values, {
      onSuccess: (workspace) => {
        toast.success("Workspace created");
        onDone();
        router.push(`/w/${workspace.id}/dashboard`);
        router.refresh();
      },
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="workspace-name">Name</Label>
        <Input
          id="workspace-name"
          autoComplete="off"
          placeholder="Atlas Studio"
          aria-invalid={Boolean(errors.name)}
          {...register("name")}
        />
        <FieldError message={errors.name?.message} />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={createWorkspace.isPending}>
          {createWorkspace.isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
          Create workspace
        </Button>
      </DialogFooter>
    </form>
  );
}
