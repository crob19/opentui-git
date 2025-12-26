import { createEffect, createSignal, onCleanup } from "solid-js";
import type { DialogContext } from "../components/dialog.js";
import { logger } from "../utils/logger.js";

/**
 * Custom hook for auto-refreshing git status, branches, and tags
 * Refreshes every second when no dialog is open to keep UI in sync with git state
 * @param dialog - Dialog context to check if modal is open
 * @param refetchStatus - Function to refetch git status
 * @param refetchBranches - Function to refetch branch information
 * @param refetchTags - Function to refetch tag information
 * @param interval - Refresh interval in milliseconds (defaults to 1000ms)
 * @returns Cleanup function that clears the auto-refresh interval
 */
export function useAutoRefresh(
  dialog: DialogContext,
  refetchStatus: () => Promise<unknown>,
  refetchBranches: () => Promise<unknown>,
  refetchTags: () => Promise<unknown>,
  interval: number = 1000,
): () => void {
  // Track whether an auto-refresh is currently in progress with proper reactivity
  const [isAutoRefreshing, setIsAutoRefreshing] = createSignal(false);

  // Store interval ID outside reactive context so we can manually clean it up
  let refreshInterval: NodeJS.Timeout | null = null;

  // Auto-refresh git status (similar to lazygit's approach)
  // Using createEffect ensures proper Solid.js lifecycle management
  createEffect(() => {
    // Guard: Prevent creating multiple intervals if createEffect re-runs
    // This prevents memory leaks from having multiple setInterval instances
    // when the effect re-executes (e.g., during hot module reloading)
    if (refreshInterval !== null) {
      logger.debug("Auto-refresh interval already exists, skipping creation");
      return;
    }

    refreshInterval = setInterval(() => {
      // Skip refresh when a dialog is open or a previous auto-refresh is still running
      if (dialog.isOpen || isAutoRefreshing()) {
        return;
      }

      logger.debug("Auto-refresh triggered");
      setIsAutoRefreshing(true);

      Promise.all([refetchStatus(), refetchBranches(), refetchTags()])
        .catch((error) => {
          console.error("Error during auto-refresh:", error);
        })
        .finally(() => {
          setIsAutoRefreshing(false);
        });
    }, interval);

    logger.debug("Auto-refresh interval started");

    onCleanup(() => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null; // Reset to allow recreation if component remounts
        logger.debug("Auto-refresh interval cleared (SolidJS cleanup)");
      }
    });
  });

  // Return manual cleanup function for graceful shutdown
  return () => {
    logger.debug("Auto-refresh cleanup called");
    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
      logger.debug("Auto-refresh interval cleared");
    }
  };
}
