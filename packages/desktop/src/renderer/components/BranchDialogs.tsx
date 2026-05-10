import { FormEvent, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type NameDialogProps = {
  open: boolean;
  title: string;
  description: string;
  label: string;
  defaultValue?: string;
  submitLabel: string;
  loading?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string) => void | Promise<void>;
};

function NameDialog({
  open,
  title,
  description,
  label,
  defaultValue = "",
  submitLabel,
  loading = false,
  onOpenChange,
  onSubmit,
}: NameDialogProps) {
  const [name, setName] = useState(defaultValue);

  useEffect(() => {
    if (open) setName(defaultValue);
  }, [defaultValue, open]);

  const trimmed = name.trim();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!trimmed) return;
    await onSubmit(trimmed);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <label className="grid gap-2 text-sm">
            <span className="font-medium">{label}</span>
            <input
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!trimmed || loading}>
              {loading ? "Working..." : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function NewBranchDialog({
  source,
  ...props
}: Omit<NameDialogProps, "title" | "description" | "label" | "submitLabel"> & {
  source?: string | null;
}) {
  return (
    <NameDialog
      {...props}
      title={source ? "New Branch From Here" : "New Branch"}
      description={
        source
          ? `Create and check out a branch from ${source}.`
          : "Create and check out a branch from the current HEAD."
      }
      label="Branch name"
      submitLabel="Create branch"
    />
  );
}

export function RenameBranchDialog(
  props: Omit<
    NameDialogProps,
    "title" | "description" | "label" | "submitLabel"
  > & { branchName: string },
) {
  return (
    <NameDialog
      {...props}
      title="Rename Branch"
      description={`Rename ${props.branchName}.`}
      label="New branch name"
      submitLabel="Rename"
    />
  );
}

export function CreateTagDialog(
  props: Omit<
    NameDialogProps,
    "title" | "description" | "label" | "submitLabel"
  >,
) {
  return (
    <NameDialog
      {...props}
      title="Create Tag"
      description="Create a lightweight tag at HEAD."
      label="Tag name"
      submitLabel="Create tag"
    />
  );
}
