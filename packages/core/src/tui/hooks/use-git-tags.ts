import { createSignal, createResource, type Accessor, type Setter, type Resource } from "solid-js";
import type { GitClient } from "@opentui-git/sdk";

/**
 * Result object returned by useGitTags hook
 */
export interface UseGitTagsResult {
  /** Tags resource (reactive) */
  tags: Resource<string[]>;
  /** Function to manually refetch tags */
  refetchTags: () => Promise<string[] | undefined>;
  /** All tags sorted alphabetically */
  allTags: Accessor<string[]>;
  /** Currently selected tag index */
  selectedIndex: Accessor<number>;
  /** Function to set selected tag index */
  setSelectedIndex: Setter<number>;
  /** Currently selected tag name */
  selectedTag: Accessor<string | null>;
}

/**
 * Custom hook for managing git tag state and loading
 * Handles tag loading, sorting, and tag selection
 * @param client - SDK client for API operations
 * @returns Object containing tags resource, sorted tags list, and selection state
 */
export function useGitTags(client: GitClient): UseGitTagsResult {
  const [selectedIndex, setSelectedIndex] = createSignal(0);

  // Load tags
  const [tags, { refetch: refetchTags }] =
    createResource<string[]>(async () => {
      try {
        return await client.getTags();
      } catch (error) {
        console.error("Error loading tags:", error);
        throw error;
      }
    });

  // Get all tags sorted alphabetically (most recent versions usually sort last)
  const allTags = () => {
    const t = tags();
    if (!t) return [];
    return [...t].sort((a, b) => b.localeCompare(a)); // Reverse alphabetical so v2.0.0 comes before v1.0.0
  };

  // Get selected tag name
  const selectedTag = () => {
    const list = allTags();
    return list[selectedIndex()] || null;
  };

  return {
    tags,
    refetchTags: refetchTags as () => Promise<string[] | undefined>,
    allTags,
    selectedIndex,
    setSelectedIndex,
    selectedTag,
  };
}
