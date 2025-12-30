/**
 * Calculate the visible window for virtual scrolling
 * @param totalItems - Total number of items in the list
 * @param selectedIndex - Currently selected item index
 * @param maxVisible - Maximum number of items to show at once
 * @returns Object with start index, end index, and visible items slice
 */
export function calculateVirtualScrollWindow<T>(
  items: T[],
  selectedIndex: number,
  maxVisible: number,
): { start: number; end: number; visibleItems: T[] } {
  // If we have fewer items than the max, show all items
  if (items.length <= maxVisible) {
    return {
      start: 0,
      end: items.length,
      visibleItems: items,
    };
  }

  // Calculate scroll window to keep selected item visible
  let start = Math.max(0, selectedIndex - Math.floor(maxVisible / 2));
  let end = start + maxVisible;

  // Adjust if we're near the end
  if (end > items.length) {
    end = items.length;
    start = Math.max(0, end - maxVisible);
  }

  return {
    start,
    end,
    visibleItems: items.slice(start, end),
  };
}
