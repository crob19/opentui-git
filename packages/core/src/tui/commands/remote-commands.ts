import type { RemoteCommandContext } from "./types.js";
import { handleAsyncOperation } from "../utils/error-handler.js";
import { runMutation } from "../data/operations.js";
import { PullDocument, PushDocument } from "@opentui-git/client";

/**
 * Pull changes from remote repository
 * Shows loading toast, executes pull, shows success/error toast, and refreshes status/branches
 * @param context - Command context with git service, toast, and refetch
 */
export async function pull(context: RemoteCommandContext): Promise<void> {
  console.log("Pulling from remote...");
  context.toast.info("Pulling from remote...");

  const result = await handleAsyncOperation(
    () => runMutation(context.client, PullDocument),
    {
      toast: context.toast,
      setErrorMessage: context.setErrorMessage,
      operation: "Pull",
    },
  );

  if (result !== null) {
    console.log("Pull successful");
    context.toast.success("Pull successful");
    await context.refetch();
    await context.refetchBranches();
  }
}

/**
 * Push changes to remote repository
 * Shows loading toast, executes push, shows success/error toast, and refreshes status/branches
 * @param context - Command context with git service, toast, and refetch
 */
export async function push(context: RemoteCommandContext): Promise<void> {
  console.log("Pushing to remote...");
  context.toast.info("Pushing to remote...");

  const result = await handleAsyncOperation(
    () => runMutation(context.client, PushDocument),
    {
      toast: context.toast,
      setErrorMessage: context.setErrorMessage,
      operation: "Push",
    },
  );

  if (result !== null) {
    console.log("Push successful");
    context.toast.success("Push successful");
    await context.refetch();
    await context.refetchBranches();
  }
}
