import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  baseBranch: string;
  headBranch: string;
  url: string | null;
  onOpenChange: (open: boolean) => void;
  onOpenPullRequest: () => void;
};

export function OpenPullRequestDialog({
  open,
  baseBranch,
  headBranch,
  url,
  onOpenChange,
  onOpenPullRequest,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Open Pull Request</DialogTitle>
          <DialogDescription>
            Open a GitHub pull request from this branch.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 rounded-md border border-border bg-muted/30 p-3 text-sm">
          <div className="grid grid-cols-[80px_1fr] gap-3">
            <span className="text-muted-foreground">Base</span>
            <span className="min-w-0 truncate font-mono">{baseBranch}</span>
          </div>
          <div className="grid grid-cols-[80px_1fr] gap-3">
            <span className="text-muted-foreground">Compare</span>
            <span className="min-w-0 truncate font-mono">{headBranch}</span>
          </div>
        </div>
        {!url && (
          <p className="text-sm text-destructive">
            No GitHub remote URL was found for this repository.
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!url} onClick={onOpenPullRequest}>
            Open pull request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
