/**
 * Get the Shiki language identifier from a file path
 * @param filePath - Path to the file
 * @returns Shiki language identifier
 */
export function getLanguageFromPath(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase();
  const langMap: Record<string, string> = {
    js: "javascript",
    jsx: "jsx",
    ts: "typescript",
    tsx: "tsx",
    py: "python",
    go: "go",
    rs: "rust",
    c: "c",
    cpp: "cpp",
    cc: "cpp",
    cxx: "cpp",
    h: "c",
    hpp: "cpp",
  };
  return langMap[ext || ""] || "javascript";
}
