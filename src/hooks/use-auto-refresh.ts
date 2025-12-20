import { createEffect, onCleanup } from "solid-js";
import type { DialogContext } from "../components/dialog.js";

/**
 * Custom hook for auto-refreshing git status and branches
 * Refreshes every second when no dialog is open to keep UI in sync with git state
 * @param dialog - Dialog context to check if modal is open
 * @param refetchStatus - Function to refetch git status
 * @param refetchBranches - Function to refetch branch information
 * @param interval - Refresh interval in milliseconds (defaults to 1000ms)
 */
export function useAutoRefresh(
  dialog: DialogContext,
  refetchStatus: () => Promise<unknown>,
  refetchBranches: () => Promise<unknown>,
  interval: number = 1000,
): void {
  // Track whether an auto-refresh is currently in progress to avoid overlapping git calls
  let isAutoRefreshing = false;

  // Auto-refresh git status (similar to lazygit's approach)
  // Using createEffect ensures proper Solid.js lifecycle management
  createEffect(() => {
    const refreshInterval = setInterval(() => {
      // Skip refresh when a dialog is open or a previous auto-refresh is still running
      if (dialog.isOpen || isAutoRefreshing) {
        return;
      }

      isAutoRefreshing = true;

      Promise.all([refetchStatus(), refetchBranches()])
        .catch((error) => {
          console.error("Error during auto-refresh:", error);
        })
        .finally(() => {
          isAutoRefreshing = false;
        });
    }, interval);

    onCleanup(() => {
      clearInterval(refreshInterval);
    });
  });
}
