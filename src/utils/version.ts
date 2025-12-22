import packageJson from "../../package.json" with { type: "json" };

/**
 * Get the current version of opentui-git
 */
export function getVersion(): string {
  return packageJson.version;
}

/**
 * Get formatted version string for display
 */
export function getVersionString(): string {
  return `v${packageJson.version}`;
}
