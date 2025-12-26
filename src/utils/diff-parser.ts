import { parsePatch } from "diff";

/**
 * Represents a row in a side-by-side diff view
 */
export interface DiffRow {
  /** Content of the left side (old version) */
  left: string;
  /** Content of the right side (new version) */
  right: string;
  /** Line number in the old version (null if line doesn't exist) */
  leftLineNum: number | null;
  /** Line number in the new version (null if line doesn't exist) */
  rightLineNum: number | null;
  /** Type of change this row represents */
  type: "added" | "removed" | "unchanged" | "modified";
}

/**
 * Parse a unified diff string into side-by-side diff rows
 * @param diffString - Unified diff output from git
 * @returns Array of DiffRow objects for side-by-side display
 */
export function parseSideBySideDiff(diffString: string): DiffRow[] {
  const diffRows: DiffRow[] = [];
  
  try {
    const patches = parsePatch(diffString);
    
    for (const patch of patches) {
      // Initialize line numbers from first hunk
      let leftLineNum = patch.hunks[0]?.oldStart || 1;
      let rightLineNum = patch.hunks[0]?.newStart || 1;
      
      for (const hunk of patch.hunks) {
        const lines = hunk.lines;
        let i = 0;
        
        while (i < lines.length) {
          const line = lines[i];
          const content = line.slice(1);
          const prefix = line[0];
          
          if (prefix === "-") {
            // Collect consecutive removals
            const removals: string[] = [content];
            const removalLineNums: number[] = [leftLineNum++];
            let j = i + 1;
            
            while (j < lines.length && lines[j][0] === "-") {
              removals.push(lines[j].slice(1));
              removalLineNums.push(leftLineNum++);
              j++;
            }
            
            // Collect consecutive additions that follow
            const additions: string[] = [];
            const additionLineNums: number[] = [];
            while (j < lines.length && lines[j][0] === "+") {
              additions.push(lines[j].slice(1));
              additionLineNums.push(rightLineNum++);
              j++;
            }
            
            // Pair removals with additions
            const maxLength = Math.max(removals.length, additions.length);
            for (let k = 0; k < maxLength; k++) {
              const hasLeft = k < removals.length;
              const hasRight = k < additions.length;
              
              if (hasLeft && hasRight) {
                // Both sides exist - this is a modification
                diffRows.push({
                  left: removals[k],
                  right: additions[k],
                  leftLineNum: removalLineNums[k],
                  rightLineNum: additionLineNums[k],
                  type: "modified",
                });
              } else if (hasLeft) {
                // Only left side - this is a removal
                diffRows.push({
                  left: removals[k],
                  right: "",
                  leftLineNum: removalLineNums[k],
                  rightLineNum: null,
                  type: "removed",
                });
              } else if (hasRight) {
                // Only right side - this is an addition
                diffRows.push({
                  left: "",
                  right: additions[k],
                  leftLineNum: null,
                  rightLineNum: additionLineNums[k],
                  type: "added",
                });
              }
            }
            
            i = j;
          } else if (prefix === "+") {
            // Standalone addition (not paired with removal)
            diffRows.push({
              left: "",
              right: content,
              leftLineNum: null,
              rightLineNum: rightLineNum++,
              type: "added",
            });
            i++;
          } else if (prefix === " ") {
            // Unchanged line (context)
            diffRows.push({
              left: content,
              right: content,
              leftLineNum: leftLineNum++,
              rightLineNum: rightLineNum++,
              type: "unchanged",
            });
            i++;
          } else {
            // Skip unknown lines
            i++;
          }
        }
      }
    }
  } catch (error) {
    console.error("Failed to parse diff:", error);
  }
  
  return diffRows;
}
