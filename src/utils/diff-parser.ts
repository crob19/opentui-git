import { parsePatch } from "diff";

/**
 * Represents a line in a unified diff view
 */
export interface DiffLine {
  content: string;
  type: "add" | "remove" | "context" | "header";
  oldLineNum: number | null;
  newLineNum: number | null;
}

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
      for (const hunk of patch.hunks) {
        // Initialize line numbers from this hunk's start positions
        let leftLineNum = hunk.oldStart || 1;
        let rightLineNum = hunk.newStart || 1;
        const lines = hunk.lines;
        let i = 0;
        
        while (i < lines.length) {
          const line = lines[i];
          
          // Skip empty lines
          if (line.length === 0) {
            i++;
            continue;
          }
          
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
    const diffLength = diffString.length;
    const diffPreview = diffString.slice(0, 200);
    console.error(
      "Failed to parse diff. Length:",
      diffLength,
      "Preview:",
      diffPreview,
      "Error:",
      error
    );
  }
  
  return diffRows;
}

/**
 * Parse a unified diff string into lines for unified view
 * @param diff - Unified diff output from git
 * @returns Array of DiffLine objects for unified display
 */
export function parseDiffLines(diff: string): DiffLine[] {
  const lines = diff.split("\n");
  let oldLineNum = 0;
  let newLineNum = 0;

  return lines
    .filter((line) => {
      // Filter out git header lines
      if (line.startsWith("diff --git")) return false;
      if (line.startsWith("index ")) return false;
      if (line.startsWith("new file mode")) return false;
      if (line.startsWith("deleted file mode")) return false;
      if (line.startsWith("similarity index")) return false;
      if (line.startsWith("rename from")) return false;
      if (line.startsWith("rename to")) return false;
      return true;
    })
    .map((line) => {
      if (line.startsWith("@@")) {
        const match = line.match(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
        if (match) {
          oldLineNum = parseInt(match[1]) - 1;
          newLineNum = parseInt(match[3]) - 1;
        }
        return { content: line, type: "header" as const, oldLineNum: null, newLineNum: null };
      } else if (line.startsWith("+++") || line.startsWith("---")) {
        return { content: line, type: "header" as const, oldLineNum: null, newLineNum: null };
      } else if (line.startsWith("+")) {
        newLineNum++;
        return { content: line.slice(1), type: "add" as const, oldLineNum: null, newLineNum };
      } else if (line.startsWith("-")) {
        oldLineNum++;
        return { content: line.slice(1), type: "remove" as const, oldLineNum, newLineNum: null };
      } else {
        oldLineNum++;
        newLineNum++;
        return { content: line.length > 0 ? line.slice(1) : "", type: "context" as const, oldLineNum, newLineNum };
      }
    });
}
