import type { RemoteCommandContext } from "./types.js";
import { handleAsyncOperation } from "../utils/error-handler.js";

/**
 * Pull changes from remote repository
 * Shows loading toast, executes pull, shows success/error toast, and refreshes status
 * @param context - Command context with git service, toast, and refetch
 */
export async function pull(context: RemoteCommandContext): Promise<void> {
  console.log("Pulling from remote...");
  context.toast.info("Pulling from remote...");

  const result = await handleAsyncOperation(
    () => context.client.pull(),
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
  }
}

/**
 * Push changes to remote repository
 * Shows loading toast, executes push, shows success/error toast, and refreshes status
 * @param context - Command context with git service, toast, and refetch
 */
export async function push(context: RemoteCommandContext): Promise<void> {
  console.log("Pushing to remote...");
  context.toast.info("Pushing to remote...");

  const result = await handleAsyncOperation(
    () => context.client.push(),
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
  }
}
