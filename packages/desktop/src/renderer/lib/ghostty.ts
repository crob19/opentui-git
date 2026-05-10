import { Ghostty } from "ghostty-web";

let shared: Promise<Ghostty> | undefined;

/**
 * Returns a process-wide shared Ghostty WASM instance, compiled lazily on
 * first call. Safe to invoke from multiple terminal mounts — the WASM module
 * is only compiled once.
 */
export function loadGhostty(): Promise<Ghostty> {
  if (!shared) {
    shared = Ghostty.load().catch((err) => {
      // Reset on failure so a retry can attempt the load again.
      shared = undefined;
      throw err;
    });
  }
  return shared;
}
