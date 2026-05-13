import { useCallback, useRef } from "react";

// Stable wrapper around a changing callback. Used to bridge pierre/trees'
// useFileTree, which captures its callbacks once at mount.
export function useLatestCallback<Args extends unknown[], R>(
  fn: (...args: Args) => R,
): (...args: Args) => R {
  const ref = useRef(fn);
  ref.current = fn;
  return useCallback((...args: Args) => ref.current(...args), []);
}
