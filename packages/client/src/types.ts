import type {
  StatusQuery,
  BranchesQuery,
  CommitsQuery,
  RepoInfoQuery,
  FileStatusFieldsFragment,
  CreateBranchMutation,
  CheckoutBranchMutation,
  DeleteBranchMutation,
  MergeBranchMutation,
  CreateTagMutation,
  PushTagMutation,
  CommitMutation,
  StageFileMutation,
  UnstageFileMutation,
  StageAllMutation,
  UnstageAllMutation,
  PullMutation,
  PushMutation,
  ReadFileQuery,
  WriteFileMutation,
} from "./graphql/generated.js";

export type GitFileStatus = FileStatusFieldsFragment;
export type GitStatusSummary = StatusQuery["status"];
export type GitBranchInfo = BranchesQuery["branches"];
export type GitCommitInfo = CommitsQuery["commits"][number];
export type RepoInfo = RepoInfoQuery["repoInfo"];

export type BranchResult = CreateBranchMutation["createBranch"];
export type MergeOutcome = MergeBranchMutation["mergeBranch"];
export type TagResult = CreateTagMutation["createTag"];
export type CommitResult = CommitMutation["commit"];
export type StageResult = StageFileMutation["stageFile"];
export type RemoteResult = PullMutation["pull"];
export type FileReadResult = ReadFileQuery["readFile"];
export type FileWriteResult = WriteFileMutation["writeFile"];

export interface DiffOptions {
  staged?: boolean;
  branch?: string;
}

export interface GitClient {
  getRepoInfo(): Promise<RepoInfo>;
  getStatus(): Promise<GitStatusSummary>;

  getBranches(): Promise<GitBranchInfo>;
  getDefaultBranch(): Promise<string>;
  createBranch(name: string): Promise<BranchResult>;
  checkoutBranch(name: string): Promise<BranchResult>;
  deleteBranch(name: string, force?: boolean): Promise<BranchResult>;
  mergeBranch(name: string): Promise<MergeOutcome>;

  getTags(): Promise<string[]>;
  createTag(name: string): Promise<TagResult>;
  pushTag(name: string, remote?: string): Promise<TagResult>;

  getCommits(limit?: number): Promise<GitCommitInfo[]>;
  getCurrentCommitHash(): Promise<string>;
  commit(message: string): Promise<CommitResult>;

  getDiff(path: string, options?: DiffOptions): Promise<string>;
  getFilesChangedAgainstBranch(branch: string): Promise<GitFileStatus[]>;

  stageFile(path: string): Promise<StageResult>;
  unstageFile(path: string): Promise<StageResult>;
  stageAll(): Promise<StageResult>;
  unstageAll(): Promise<StageResult>;

  readFile(path: string): Promise<FileReadResult>;
  writeFile(
    path: string,
    content: string,
    expectedMtime?: Date,
  ): Promise<FileWriteResult>;

  pull(): Promise<RemoteResult>;
  push(): Promise<RemoteResult>;
}

// Suppress "imported but unused" for re-exported alias parents picked up by consumers.
export type {
  CheckoutBranchMutation,
  DeleteBranchMutation,
  PushTagMutation,
  UnstageFileMutation,
  StageAllMutation,
  UnstageAllMutation,
  PushMutation,
};
