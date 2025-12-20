import type { Accessor, Setter } from "solid-js";
import type { PanelType } from "./types.js";

/**
 * Navigate up in the current list (decrease selected index)
 * @param selectedIndex - Accessor for current selected index
 * @param setSelectedIndex - Setter for selected index
 */
export function navigateUp(
  selectedIndex: Accessor<number>,
  setSelectedIndex: Setter<number>,
): void {
  setSelectedIndex((prev) => {
    const next = Math.max(prev - 1, 0);
    console.log(`Navigation up: ${prev} -> ${next}`);
    return next;
  });
}

/**
 * Navigate down in the current list (increase selected index)
 * @param selectedIndex - Accessor for current selected index
 * @param setSelectedIndex - Setter for selected index
 * @param maxIndex - Maximum index value (list length - 1)
 */
export function navigateDown(
  selectedIndex: Accessor<number>,
  setSelectedIndex: Setter<number>,
  maxIndex: number,
): void {
  setSelectedIndex((prev) => {
    const next = Math.min(prev + 1, maxIndex);
    console.log(`Navigation down: ${prev} -> ${next} (max: ${maxIndex})`);
    return next;
  });
}

/**
 * Switch between files and branches panels
 * @param activePanel - Accessor for current active panel
 * @param setActivePanel - Setter for active panel
 */
export function switchPanel(
  activePanel: Accessor<PanelType>,
  setActivePanel: Setter<PanelType>,
): void {
  setActivePanel((prev) => (prev === "files" ? "branches" : "files"));
}
