import { GraphQLResolveInfo } from "graphql";
import {
  GitStatusSummary,
  GitFileStatus,
  GitBranchInfo,
  GitCommitInfo,
} from "./git/types.js";
import { Context } from "./infra/context";
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>;
};
export type MakeEmpty<
  T extends { [key: string]: unknown },
  K extends keyof T,
> = { [_ in K]?: never };
export type Incremental<T> =
  | T
  | {
      [P in keyof T]?: P extends " $fragmentName" | "__typename" ? T[P] : never;
    };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & {
  [P in K]-?: NonNullable<T[P]>;
};
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
};

export type BranchDetail = {
  __typename?: "BranchDetail";
  ahead: Scalars["Int"]["output"];
  behind: Scalars["Int"]["output"];
  commit: Scalars["String"]["output"];
  current: Scalars["Boolean"]["output"];
  label: Scalars["String"]["output"];
  name: Scalars["String"]["output"];
};

export type BranchResult = {
  __typename?: "BranchResult";
  branch?: Maybe<Scalars["String"]["output"]>;
  success: Scalars["Boolean"]["output"];
};

export type Branches = {
  __typename?: "Branches";
  all: Array<Scalars["String"]["output"]>;
  branches: Array<BranchDetail>;
  current: Scalars["String"]["output"];
};

export type Commit = {
  __typename?: "Commit";
  authorEmail: Scalars["String"]["output"];
  authorName: Scalars["String"]["output"];
  date: Scalars["String"]["output"];
  hash: Scalars["String"]["output"];
  message: Scalars["String"]["output"];
};

export type CommitResult = {
  __typename?: "CommitResult";
  commit?: Maybe<Scalars["String"]["output"]>;
  success: Scalars["Boolean"]["output"];
};

export type DiffOptions = {
  branch?: InputMaybe<Scalars["String"]["input"]>;
  staged?: InputMaybe<Scalars["Boolean"]["input"]>;
};

export type FileReadResult = {
  __typename?: "FileReadResult";
  content: Scalars["String"]["output"];
  mtime: Scalars["String"]["output"];
};

export type FileStatus = {
  __typename?: "FileStatus";
  color: Scalars["String"]["output"];
  hasLocalChanges?: Maybe<Scalars["Boolean"]["output"]>;
  index: Scalars["String"]["output"];
  path: Scalars["String"]["output"];
  staged: Scalars["Boolean"]["output"];
  statusText: Scalars["String"]["output"];
  workingDir: Scalars["String"]["output"];
};

export type FileWriteResult = {
  __typename?: "FileWriteResult";
  conflict: Scalars["Boolean"]["output"];
  message?: Maybe<Scalars["String"]["output"]>;
  success: Scalars["Boolean"]["output"];
};

export type MergeOutcome = {
  __typename?: "MergeOutcome";
  conflicts: Array<Scalars["String"]["output"]>;
  merges: Array<Scalars["String"]["output"]>;
  result: Scalars["String"]["output"];
  success: Scalars["Boolean"]["output"];
};

export type Mutation = {
  __typename?: "Mutation";
  checkoutBranch: BranchResult;
  commit: CommitResult;
  createBranch: BranchResult;
  createTag: TagResult;
  deleteBranch: BranchResult;
  fetch: RemoteResult;
  forcePush: RemoteResult;
  mergeBranch: MergeOutcome;
  pull: RemoteResult;
  push: RemoteResult;
  pushTag: TagResult;
  renameBranch: BranchResult;
  stageAll: StageResult;
  stageFile: StageResult;
  stageFiles: StageResult;
  unstageAll: StageResult;
  unstageFile: StageResult;
  unstageFiles: StageResult;
  writeFile: FileWriteResult;
};

export type MutationCheckoutBranchArgs = {
  name: Scalars["String"]["input"];
};

export type MutationCommitArgs = {
  message: Scalars["String"]["input"];
};

export type MutationCreateBranchArgs = {
  name: Scalars["String"]["input"];
  source?: InputMaybe<Scalars["String"]["input"]>;
};

export type MutationCreateTagArgs = {
  name: Scalars["String"]["input"];
};

export type MutationDeleteBranchArgs = {
  force?: InputMaybe<Scalars["Boolean"]["input"]>;
  name: Scalars["String"]["input"];
};

export type MutationMergeBranchArgs = {
  name: Scalars["String"]["input"];
};

export type MutationPushTagArgs = {
  name: Scalars["String"]["input"];
  remote?: InputMaybe<Scalars["String"]["input"]>;
};

export type MutationRenameBranchArgs = {
  newName: Scalars["String"]["input"];
  oldName: Scalars["String"]["input"];
};

export type MutationStageFileArgs = {
  path: Scalars["String"]["input"];
};

export type MutationStageFilesArgs = {
  paths: Array<Scalars["String"]["input"]>;
};

export type MutationUnstageFileArgs = {
  path: Scalars["String"]["input"];
};

export type MutationUnstageFilesArgs = {
  paths: Array<Scalars["String"]["input"]>;
};

export type MutationWriteFileArgs = {
  content: Scalars["String"]["input"];
  expectedMtime?: InputMaybe<Scalars["String"]["input"]>;
  path: Scalars["String"]["input"];
};

export type Query = {
  __typename?: "Query";
  branches: Branches;
  commits: Array<Commit>;
  currentCommitHash: Scalars["String"]["output"];
  defaultBranch: Scalars["String"]["output"];
  diff: Scalars["String"]["output"];
  filesChangedAgainstBranch: Array<FileStatus>;
  readFile: FileReadResult;
  repoInfo: RepoInfo;
  repoTree: Array<TreeEntry>;
  status: RepoStatus;
  tags: Array<Scalars["String"]["output"]>;
};

export type QueryCommitsArgs = {
  limit?: InputMaybe<Scalars["Int"]["input"]>;
};

export type QueryDiffArgs = {
  options?: InputMaybe<DiffOptions>;
  path: Scalars["String"]["input"];
};

export type QueryFilesChangedAgainstBranchArgs = {
  branch: Scalars["String"]["input"];
};

export type QueryReadFileArgs = {
  path: Scalars["String"]["input"];
};

export type QueryRepoTreeArgs = {
  path?: InputMaybe<Scalars["String"]["input"]>;
};

export type RemoteResult = {
  __typename?: "RemoteResult";
  success: Scalars["Boolean"]["output"];
};

export type RepoInfo = {
  __typename?: "RepoInfo";
  isRepo: Scalars["Boolean"]["output"];
  remoteUrl?: Maybe<Scalars["String"]["output"]>;
  repoRoot?: Maybe<Scalars["String"]["output"]>;
};

export type RepoStatus = {
  __typename?: "RepoStatus";
  ahead: Scalars["Int"]["output"];
  behind: Scalars["Int"]["output"];
  current: Scalars["String"]["output"];
  files: Array<FileStatus>;
  isClean: Scalars["Boolean"]["output"];
};

export type StageResult = {
  __typename?: "StageResult";
  success: Scalars["Boolean"]["output"];
};

export type TagResult = {
  __typename?: "TagResult";
  success: Scalars["Boolean"]["output"];
  tag?: Maybe<Scalars["String"]["output"]>;
};

export type TreeEntry = {
  __typename?: "TreeEntry";
  name: Scalars["String"]["output"];
  path: Scalars["String"]["output"];
  type: TreeEntryType;
};

export enum TreeEntryType {
  Dir = "DIR",
  File = "FILE",
}

export type WithIndex<TObject> = TObject & Record<string, any>;
export type ResolversObject<TObject> = WithIndex<TObject>;

export type ResolverTypeWrapper<T> = Promise<T> | T;

export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =
  | ResolverFn<TResult, TParent, TContext, TArgs>
  | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<
  TResult,
  TKey extends string,
  TParent,
  TContext,
  TArgs,
> {
  subscribe: SubscriptionSubscribeFn<
    { [key in TKey]: TResult },
    TParent,
    TContext,
    TArgs
  >;
  resolve?: SubscriptionResolveFn<
    TResult,
    { [key in TKey]: TResult },
    TContext,
    TArgs
  >;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<
  TResult,
  TKey extends string,
  TParent,
  TContext,
  TArgs,
> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<
  TResult,
  TKey extends string,
  TParent = {},
  TContext = {},
  TArgs = {},
> =
  | ((
      ...args: any[]
    ) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo,
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (
  obj: T,
  context: TContext,
  info: GraphQLResolveInfo,
) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<
  TResult = {},
  TParent = {},
  TContext = {},
  TArgs = {},
> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => TResult | Promise<TResult>;

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = ResolversObject<{
  Boolean: ResolverTypeWrapper<Scalars["Boolean"]["output"]>;
  BranchDetail: ResolverTypeWrapper<BranchDetail>;
  BranchResult: ResolverTypeWrapper<BranchResult>;
  Branches: ResolverTypeWrapper<GitBranchInfo>;
  Commit: ResolverTypeWrapper<GitCommitInfo>;
  CommitResult: ResolverTypeWrapper<CommitResult>;
  DiffOptions: DiffOptions;
  FileReadResult: ResolverTypeWrapper<FileReadResult>;
  FileStatus: ResolverTypeWrapper<GitFileStatus>;
  FileWriteResult: ResolverTypeWrapper<FileWriteResult>;
  Int: ResolverTypeWrapper<Scalars["Int"]["output"]>;
  MergeOutcome: ResolverTypeWrapper<MergeOutcome>;
  Mutation: ResolverTypeWrapper<{}>;
  Query: ResolverTypeWrapper<{}>;
  RemoteResult: ResolverTypeWrapper<RemoteResult>;
  RepoInfo: ResolverTypeWrapper<RepoInfo>;
  RepoStatus: ResolverTypeWrapper<GitStatusSummary>;
  StageResult: ResolverTypeWrapper<StageResult>;
  String: ResolverTypeWrapper<Scalars["String"]["output"]>;
  TagResult: ResolverTypeWrapper<TagResult>;
  TreeEntry: ResolverTypeWrapper<TreeEntry>;
  TreeEntryType: TreeEntryType;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  Boolean: Scalars["Boolean"]["output"];
  BranchDetail: BranchDetail;
  BranchResult: BranchResult;
  Branches: GitBranchInfo;
  Commit: GitCommitInfo;
  CommitResult: CommitResult;
  DiffOptions: DiffOptions;
  FileReadResult: FileReadResult;
  FileStatus: GitFileStatus;
  FileWriteResult: FileWriteResult;
  Int: Scalars["Int"]["output"];
  MergeOutcome: MergeOutcome;
  Mutation: {};
  Query: {};
  RemoteResult: RemoteResult;
  RepoInfo: RepoInfo;
  RepoStatus: GitStatusSummary;
  StageResult: StageResult;
  String: Scalars["String"]["output"];
  TagResult: TagResult;
  TreeEntry: TreeEntry;
}>;

export type BranchDetailResolvers<
  ContextType = Context,
  ParentType extends
    ResolversParentTypes["BranchDetail"] = ResolversParentTypes["BranchDetail"],
> = ResolversObject<{
  ahead?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  behind?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  commit?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  current?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  label?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  name?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type BranchResultResolvers<
  ContextType = Context,
  ParentType extends
    ResolversParentTypes["BranchResult"] = ResolversParentTypes["BranchResult"],
> = ResolversObject<{
  branch?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  success?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type BranchesResolvers<
  ContextType = Context,
  ParentType extends
    ResolversParentTypes["Branches"] = ResolversParentTypes["Branches"],
> = ResolversObject<{
  all?: Resolver<Array<ResolversTypes["String"]>, ParentType, ContextType>;
  branches?: Resolver<
    Array<ResolversTypes["BranchDetail"]>,
    ParentType,
    ContextType
  >;
  current?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type CommitResolvers<
  ContextType = Context,
  ParentType extends
    ResolversParentTypes["Commit"] = ResolversParentTypes["Commit"],
> = ResolversObject<{
  authorEmail?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  authorName?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  date?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  hash?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  message?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type CommitResultResolvers<
  ContextType = Context,
  ParentType extends
    ResolversParentTypes["CommitResult"] = ResolversParentTypes["CommitResult"],
> = ResolversObject<{
  commit?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  success?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type FileReadResultResolvers<
  ContextType = Context,
  ParentType extends
    ResolversParentTypes["FileReadResult"] = ResolversParentTypes["FileReadResult"],
> = ResolversObject<{
  content?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  mtime?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type FileStatusResolvers<
  ContextType = Context,
  ParentType extends
    ResolversParentTypes["FileStatus"] = ResolversParentTypes["FileStatus"],
> = ResolversObject<{
  color?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  hasLocalChanges?: Resolver<
    Maybe<ResolversTypes["Boolean"]>,
    ParentType,
    ContextType
  >;
  index?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  path?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  staged?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  statusText?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  workingDir?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type FileWriteResultResolvers<
  ContextType = Context,
  ParentType extends
    ResolversParentTypes["FileWriteResult"] = ResolversParentTypes["FileWriteResult"],
> = ResolversObject<{
  conflict?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  message?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  success?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MergeOutcomeResolvers<
  ContextType = Context,
  ParentType extends
    ResolversParentTypes["MergeOutcome"] = ResolversParentTypes["MergeOutcome"],
> = ResolversObject<{
  conflicts?: Resolver<
    Array<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  merges?: Resolver<Array<ResolversTypes["String"]>, ParentType, ContextType>;
  result?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  success?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MutationResolvers<
  ContextType = Context,
  ParentType extends
    ResolversParentTypes["Mutation"] = ResolversParentTypes["Mutation"],
> = ResolversObject<{
  checkoutBranch?: Resolver<
    ResolversTypes["BranchResult"],
    ParentType,
    ContextType,
    RequireFields<MutationCheckoutBranchArgs, "name">
  >;
  commit?: Resolver<
    ResolversTypes["CommitResult"],
    ParentType,
    ContextType,
    RequireFields<MutationCommitArgs, "message">
  >;
  createBranch?: Resolver<
    ResolversTypes["BranchResult"],
    ParentType,
    ContextType,
    RequireFields<MutationCreateBranchArgs, "name">
  >;
  createTag?: Resolver<
    ResolversTypes["TagResult"],
    ParentType,
    ContextType,
    RequireFields<MutationCreateTagArgs, "name">
  >;
  deleteBranch?: Resolver<
    ResolversTypes["BranchResult"],
    ParentType,
    ContextType,
    RequireFields<MutationDeleteBranchArgs, "name">
  >;
  fetch?: Resolver<ResolversTypes["RemoteResult"], ParentType, ContextType>;
  forcePush?: Resolver<ResolversTypes["RemoteResult"], ParentType, ContextType>;
  mergeBranch?: Resolver<
    ResolversTypes["MergeOutcome"],
    ParentType,
    ContextType,
    RequireFields<MutationMergeBranchArgs, "name">
  >;
  pull?: Resolver<ResolversTypes["RemoteResult"], ParentType, ContextType>;
  push?: Resolver<ResolversTypes["RemoteResult"], ParentType, ContextType>;
  pushTag?: Resolver<
    ResolversTypes["TagResult"],
    ParentType,
    ContextType,
    RequireFields<MutationPushTagArgs, "name">
  >;
  renameBranch?: Resolver<
    ResolversTypes["BranchResult"],
    ParentType,
    ContextType,
    RequireFields<MutationRenameBranchArgs, "newName" | "oldName">
  >;
  stageAll?: Resolver<ResolversTypes["StageResult"], ParentType, ContextType>;
  stageFile?: Resolver<
    ResolversTypes["StageResult"],
    ParentType,
    ContextType,
    RequireFields<MutationStageFileArgs, "path">
  >;
  stageFiles?: Resolver<
    ResolversTypes["StageResult"],
    ParentType,
    ContextType,
    RequireFields<MutationStageFilesArgs, "paths">
  >;
  unstageAll?: Resolver<ResolversTypes["StageResult"], ParentType, ContextType>;
  unstageFile?: Resolver<
    ResolversTypes["StageResult"],
    ParentType,
    ContextType,
    RequireFields<MutationUnstageFileArgs, "path">
  >;
  unstageFiles?: Resolver<
    ResolversTypes["StageResult"],
    ParentType,
    ContextType,
    RequireFields<MutationUnstageFilesArgs, "paths">
  >;
  writeFile?: Resolver<
    ResolversTypes["FileWriteResult"],
    ParentType,
    ContextType,
    RequireFields<MutationWriteFileArgs, "content" | "path">
  >;
}>;

export type QueryResolvers<
  ContextType = Context,
  ParentType extends
    ResolversParentTypes["Query"] = ResolversParentTypes["Query"],
> = ResolversObject<{
  branches?: Resolver<ResolversTypes["Branches"], ParentType, ContextType>;
  commits?: Resolver<
    Array<ResolversTypes["Commit"]>,
    ParentType,
    ContextType,
    RequireFields<QueryCommitsArgs, "limit">
  >;
  currentCommitHash?: Resolver<
    ResolversTypes["String"],
    ParentType,
    ContextType
  >;
  defaultBranch?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  diff?: Resolver<
    ResolversTypes["String"],
    ParentType,
    ContextType,
    RequireFields<QueryDiffArgs, "path">
  >;
  filesChangedAgainstBranch?: Resolver<
    Array<ResolversTypes["FileStatus"]>,
    ParentType,
    ContextType,
    RequireFields<QueryFilesChangedAgainstBranchArgs, "branch">
  >;
  readFile?: Resolver<
    ResolversTypes["FileReadResult"],
    ParentType,
    ContextType,
    RequireFields<QueryReadFileArgs, "path">
  >;
  repoInfo?: Resolver<ResolversTypes["RepoInfo"], ParentType, ContextType>;
  repoTree?: Resolver<
    Array<ResolversTypes["TreeEntry"]>,
    ParentType,
    ContextType,
    Partial<QueryRepoTreeArgs>
  >;
  status?: Resolver<ResolversTypes["RepoStatus"], ParentType, ContextType>;
  tags?: Resolver<Array<ResolversTypes["String"]>, ParentType, ContextType>;
}>;

export type RemoteResultResolvers<
  ContextType = Context,
  ParentType extends
    ResolversParentTypes["RemoteResult"] = ResolversParentTypes["RemoteResult"],
> = ResolversObject<{
  success?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type RepoInfoResolvers<
  ContextType = Context,
  ParentType extends
    ResolversParentTypes["RepoInfo"] = ResolversParentTypes["RepoInfo"],
> = ResolversObject<{
  isRepo?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  remoteUrl?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  repoRoot?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type RepoStatusResolvers<
  ContextType = Context,
  ParentType extends
    ResolversParentTypes["RepoStatus"] = ResolversParentTypes["RepoStatus"],
> = ResolversObject<{
  ahead?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  behind?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  current?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  files?: Resolver<
    Array<ResolversTypes["FileStatus"]>,
    ParentType,
    ContextType
  >;
  isClean?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type StageResultResolvers<
  ContextType = Context,
  ParentType extends
    ResolversParentTypes["StageResult"] = ResolversParentTypes["StageResult"],
> = ResolversObject<{
  success?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TagResultResolvers<
  ContextType = Context,
  ParentType extends
    ResolversParentTypes["TagResult"] = ResolversParentTypes["TagResult"],
> = ResolversObject<{
  success?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  tag?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TreeEntryResolvers<
  ContextType = Context,
  ParentType extends
    ResolversParentTypes["TreeEntry"] = ResolversParentTypes["TreeEntry"],
> = ResolversObject<{
  name?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  path?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  type?: Resolver<ResolversTypes["TreeEntryType"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type Resolvers<ContextType = Context> = ResolversObject<{
  BranchDetail?: BranchDetailResolvers<ContextType>;
  BranchResult?: BranchResultResolvers<ContextType>;
  Branches?: BranchesResolvers<ContextType>;
  Commit?: CommitResolvers<ContextType>;
  CommitResult?: CommitResultResolvers<ContextType>;
  FileReadResult?: FileReadResultResolvers<ContextType>;
  FileStatus?: FileStatusResolvers<ContextType>;
  FileWriteResult?: FileWriteResultResolvers<ContextType>;
  MergeOutcome?: MergeOutcomeResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  RemoteResult?: RemoteResultResolvers<ContextType>;
  RepoInfo?: RepoInfoResolvers<ContextType>;
  RepoStatus?: RepoStatusResolvers<ContextType>;
  StageResult?: StageResultResolvers<ContextType>;
  TagResult?: TagResultResolvers<ContextType>;
  TreeEntry?: TreeEntryResolvers<ContextType>;
}>;
