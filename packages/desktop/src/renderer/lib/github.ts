export function normalizeGitHubRemoteUrl(remoteUrl: string | null): string | null {
  if (!remoteUrl) return null;

  const sshMatch = remoteUrl.match(
    /^git@github\.com:([^/]+)\/(.+?)(?:\.git)?$/,
  );
  if (sshMatch) {
    return `https://github.com/${sshMatch[1]}/${sshMatch[2]}`;
  }

  try {
    const url = new URL(remoteUrl);
    if (url.hostname !== "github.com") return null;
    const path = url.pathname.replace(/\.git$/, "").replace(/\/$/, "");
    return `https://github.com${path}`;
  } catch {
    return null;
  }
}

export function buildGitHubPullRequestUrl(
  remoteUrl: string | null,
  baseBranch: string,
  headBranch: string,
): string | null {
  const repoUrl = normalizeGitHubRemoteUrl(remoteUrl);
  if (!repoUrl) return null;

  const base = encodeURIComponent(baseBranch);
  const head = encodeURIComponent(headBranch);
  return `${repoUrl}/compare/${base}...${head}?expand=1`;
}
