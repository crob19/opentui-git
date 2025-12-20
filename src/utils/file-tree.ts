import type { GitFileStatus, FileTreeNode } from "../types.js";
import { STATUS_COLORS } from "../types.js";

/**
 * Priority order for status colors (higher index = higher priority)
 */
const STATUS_PRIORITY = [
  STATUS_COLORS.UNTRACKED,  // Gray - lowest priority
  STATUS_COLORS.MODIFIED,   // Yellow
  STATUS_COLORS.ADDED,      // Green
  STATUS_COLORS.RENAMED,    // Blue
  STATUS_COLORS.COPIED,     // Blue
  STATUS_COLORS.UNMERGED,   // Magenta
  STATUS_COLORS.DELETED,    // Red - highest priority
] as const;

/**
 * Get the highest priority color from a list of colors
 */
function getHighestPriorityColor(colors: string[]): string {
  if (colors.length === 0) return STATUS_COLORS.DEFAULT;
  
  let highestPriority = -1;
  let result: string = STATUS_COLORS.DEFAULT;
  
  for (const color of colors) {
    const priority = STATUS_PRIORITY.indexOf(color as any);
    if (priority > highestPriority) {
      highestPriority = priority;
      result = color;
    }
  }
  
  return result;
}

/**
 * Build a file tree from a flat list of git file statuses
 * @param files - Flat array of file statuses from git
 * @returns Root-level tree nodes (all expanded by default)
 */
export function buildFileTree(files: GitFileStatus[]): FileTreeNode[] {
  // Use a temporary structure to store child maps during building
  interface TempNode extends FileTreeNode {
    _childrenMap?: Map<string, TempNode>;
  }
  
  const root: Map<string, TempNode> = new Map();
  
  // Sort files by path to ensure consistent ordering
  const sortedFiles = [...files].sort((a, b) => a.path.localeCompare(b.path));
  
  for (const file of sortedFiles) {
    const parts = file.path.split('/');
    let currentMap = root;
    let currentPath = '';
    
    // Process each part of the path
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLastPart = i === parts.length - 1;
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      
      if (isLastPart) {
        // This is a file
        const fileNode: TempNode = {
          type: 'file',
          name: part,
          path: currentPath,
          depth: i,
          fileStatus: file,
          color: file.color,
        };
        currentMap.set(part, fileNode);
      } else {
        // This is a folder
        if (!currentMap.has(part)) {
          const folderNode: TempNode = {
            type: 'folder',
            name: part,
            path: currentPath,
            depth: i,
            expanded: true, // All folders expanded by default
            children: [],
            _childrenMap: new Map(),
          };
          currentMap.set(part, folderNode);
        }
        
        const folderNode = currentMap.get(part)!;
        if (!folderNode._childrenMap) {
          folderNode._childrenMap = new Map();
        }
        
        // Move to the next level (folder's children map)
        currentMap = folderNode._childrenMap;
      }
    }
  }
  
  // Convert all maps to children arrays recursively
  function convertMapsToArrays(nodeMap: Map<string, TempNode>): FileTreeNode[] {
    const result: FileTreeNode[] = [];
    
    for (const node of nodeMap.values()) {
      // If this node is a folder with a children map, convert it
      if (node._childrenMap && node._childrenMap.size > 0) {
        node.children = convertMapsToArrays(node._childrenMap);
        delete node._childrenMap;
      } else if (node.type === 'folder') {
        // Folder with no children
        node.children = [];
        delete node._childrenMap;
      }
      
      result.push(node);
    }
    
    return result;
  }
  
  // Convert root map to array
  const rootNodes = convertMapsToArrays(root);
  
  // Calculate folder colors based on children
  calculateFolderColors(rootNodes);
  
  return rootNodes;
}

/**
 * Recursively calculate folder colors based on child file statuses
 */
function calculateFolderColors(nodes: FileTreeNode[]): void {
  for (const node of nodes) {
    if (node.type === 'folder' && node.children) {
      // First, recursively calculate colors for child folders
      calculateFolderColors(node.children);
      
      // Collect all colors from children
      const childColors: string[] = [];
      for (const child of node.children) {
        if (child.color) {
          childColors.push(child.color);
        }
      }
      
      // Set folder color to the highest priority child color
      node.color = getHighestPriorityColor(childColors);
    }
  }
}

/**
 * Flatten the tree into a renderable list, respecting collapsed folders
 * @param nodes - Tree nodes to flatten
 * @returns Flat array of nodes in display order
 */
export function flattenTree(nodes: FileTreeNode[]): FileTreeNode[] {
  const result: FileTreeNode[] = [];
  
  function traverse(nodes: FileTreeNode[]): void {
    for (const node of nodes) {
      result.push(node);
      
      // Only traverse children if this is an expanded folder
      if (node.type === 'folder' && node.expanded && node.children) {
        traverse(node.children);
      }
    }
  }
  
  traverse(nodes);
  return result;
}

/**
 * Toggle the expanded state of a folder node
 * @param nodes - Tree nodes to search
 * @param targetPath - Path of the folder to toggle
 * @returns New tree with updated expanded state
 */
export function toggleFolder(nodes: FileTreeNode[], targetPath: string): FileTreeNode[] {
  return nodes.map(node => {
    if (node.path === targetPath && node.type === 'folder') {
      return {
        ...node,
        expanded: !node.expanded,
      };
    }
    
    if (node.type === 'folder' && node.children) {
      return {
        ...node,
        children: toggleFolder(node.children, targetPath),
      };
    }
    
    return node;
  });
}

/**
 * Get all file paths within a folder (recursively)
 * @param node - Folder node to get files from
 * @returns Array of file paths
 */
export function getFilesInFolder(node: FileTreeNode): string[] {
  const files: string[] = [];
  
  function traverse(n: FileTreeNode): void {
    if (n.type === 'file' && n.fileStatus) {
      files.push(n.path);
    } else if (n.type === 'folder' && n.children) {
      for (const child of n.children) {
        traverse(child);
      }
    }
  }
  
  traverse(node);
  return files;
}

/**
 * Preserve expansion state from old tree when building new tree
 * This ensures that collapsed folders stay collapsed during refreshes
 * @param oldTree - Previous tree with user's expansion state
 * @param newTree - Newly built tree (all folders expanded by default)
 * @returns New tree with preserved expansion state
 */
export function preserveExpansionState(
  oldTree: FileTreeNode[],
  newTree: FileTreeNode[]
): FileTreeNode[] {
  // Build a map of folder paths to their expanded state from old tree
  const expansionMap = new Map<string, boolean>();
  
  function collectExpansionState(nodes: FileTreeNode[]): void {
    for (const node of nodes) {
      if (node.type === 'folder') {
        expansionMap.set(node.path, node.expanded ?? true);
        if (node.children) {
          collectExpansionState(node.children);
        }
      }
    }
  }
  
  // Apply expansion state from map to new tree
  function applyExpansionState(nodes: FileTreeNode[]): FileTreeNode[] {
    return nodes.map(node => {
      if (node.type === 'folder') {
        const preservedExpanded = expansionMap.get(node.path);
        return {
          ...node,
          expanded: preservedExpanded !== undefined ? preservedExpanded : true,
          children: node.children ? applyExpansionState(node.children) : [],
        };
      }
      return node;
    });
  }
  
  // Collect state from old tree
  collectExpansionState(oldTree);
  
  // Apply to new tree
  return applyExpansionState(newTree);
}
