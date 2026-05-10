import { GitService } from "../git/service.js";

export interface Context {
  git: GitService;
}

let sharedGit: GitService | null = null;

export function getGitService(cwd: string): GitService {
  if (!sharedGit || sharedGit["repoPath"] !== cwd) {
    sharedGit = new GitService(cwd);
  }
  return sharedGit;
}

export function buildContext(cwd: string): Context {
  return { git: getGitService(cwd) };
}
