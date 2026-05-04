import { GraphQLClient } from "graphql-request";

import type { GitClient, DiffOptions } from "./types.js";
import {
  BranchesDocument,
  CheckoutBranchDocument,
  CommitDocument,
  CommitsDocument,
  CreateBranchDocument,
  CreateTagDocument,
  CurrentCommitHashDocument,
  DefaultBranchDocument,
  DeleteBranchDocument,
  DiffDocument,
  FilesChangedAgainstBranchDocument,
  MergeBranchDocument,
  PullDocument,
  PushDocument,
  PushTagDocument,
  ReadFileDocument,
  RepoInfoDocument,
  StageAllDocument,
  StageFileDocument,
  StatusDocument,
  TagsDocument,
  UnstageAllDocument,
  UnstageFileDocument,
  WriteFileDocument,
} from "./graphql/generated.js";

export interface HttpClientOptions {
  /** GraphQL endpoint URL. The server's `ready` line emits a base URL like `http://127.0.0.1:4000/`; pass that or the full `/graphql` path. */
  endpoint: string;
  /** Optional fetch override (useful for Electron renderer / web). */
  fetch?: typeof fetch;
  /** Extra headers (auth, etc.). */
  headers?: Record<string, string>;
}

function resolveEndpoint(endpoint: string): string {
  // graphql-request expects the GraphQL endpoint, not a base URL. Apollo's
  // standalone server mounts at `/`, so a bare base URL works, but accept
  // either form.
  return endpoint;
}

export function createHttpClient(options: HttpClientOptions): GitClient {
  const client = new GraphQLClient(resolveEndpoint(options.endpoint), {
    fetch: options.fetch,
    headers: options.headers,
  });

  return {
    getRepoInfo: async () => (await client.request(RepoInfoDocument)).repoInfo,

    getStatus: async () => (await client.request(StatusDocument)).status,

    getBranches: async () => (await client.request(BranchesDocument)).branches,

    getDefaultBranch: async () =>
      (await client.request(DefaultBranchDocument)).defaultBranch,

    createBranch: async (name) =>
      (await client.request(CreateBranchDocument, { name })).createBranch,

    checkoutBranch: async (name) =>
      (await client.request(CheckoutBranchDocument, { name })).checkoutBranch,

    deleteBranch: async (name, force) =>
      (await client.request(DeleteBranchDocument, { name, force }))
        .deleteBranch,

    mergeBranch: async (name) =>
      (await client.request(MergeBranchDocument, { name })).mergeBranch,

    getTags: async () => (await client.request(TagsDocument)).tags,

    createTag: async (name) =>
      (await client.request(CreateTagDocument, { name })).createTag,

    pushTag: async (name, remote) =>
      (await client.request(PushTagDocument, { name, remote })).pushTag,

    getCommits: async (limit) =>
      (await client.request(CommitsDocument, { limit })).commits,

    getCurrentCommitHash: async () =>
      (await client.request(CurrentCommitHashDocument)).currentCommitHash,

    commit: async (message) =>
      (await client.request(CommitDocument, { message })).commit,

    getDiff: async (path, options: DiffOptions = {}) =>
      (await client.request(DiffDocument, { path, options })).diff,

    getFilesChangedAgainstBranch: async (branch) =>
      (await client.request(FilesChangedAgainstBranchDocument, { branch }))
        .filesChangedAgainstBranch,

    stageFile: async (path) =>
      (await client.request(StageFileDocument, { path })).stageFile,

    unstageFile: async (path) =>
      (await client.request(UnstageFileDocument, { path })).unstageFile,

    stageAll: async () => (await client.request(StageAllDocument)).stageAll,

    unstageAll: async () =>
      (await client.request(UnstageAllDocument)).unstageAll,

    readFile: async (path) =>
      (await client.request(ReadFileDocument, { path })).readFile,

    writeFile: async (path, content, expectedMtime) =>
      (
        await client.request(WriteFileDocument, {
          path,
          content,
          expectedMtime: expectedMtime?.toISOString(),
        })
      ).writeFile,

    pull: async () => (await client.request(PullDocument)).pull,

    push: async () => (await client.request(PushDocument)).push,
  };
}
