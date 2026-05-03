import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type BranchDetail = {
  __typename?: 'BranchDetail';
  commit: Scalars['String']['output'];
  current: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

export type BranchResult = {
  __typename?: 'BranchResult';
  branch: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
};

export type Branches = {
  __typename?: 'Branches';
  all: Array<Scalars['String']['output']>;
  branches: Array<BranchDetail>;
  current: Scalars['String']['output'];
};

export type Commit = {
  __typename?: 'Commit';
  authorEmail: Scalars['String']['output'];
  authorName: Scalars['String']['output'];
  date: Scalars['String']['output'];
  hash: Scalars['String']['output'];
  message: Scalars['String']['output'];
};

export type CommitResult = {
  __typename?: 'CommitResult';
  commit: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
};

export type DiffOptions = {
  branch?: InputMaybe<Scalars['String']['input']>;
  staged?: InputMaybe<Scalars['Boolean']['input']>;
};

export type FileReadResult = {
  __typename?: 'FileReadResult';
  content: Scalars['String']['output'];
  mtime: Scalars['String']['output'];
};

export type FileStatus = {
  __typename?: 'FileStatus';
  color: Scalars['String']['output'];
  hasLocalChanges: Maybe<Scalars['Boolean']['output']>;
  index: Scalars['String']['output'];
  path: Scalars['String']['output'];
  staged: Scalars['Boolean']['output'];
  statusText: Scalars['String']['output'];
  workingDir: Scalars['String']['output'];
};

export type FileWriteResult = {
  __typename?: 'FileWriteResult';
  conflict: Scalars['Boolean']['output'];
  message: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
};

export type MergeOutcome = {
  __typename?: 'MergeOutcome';
  conflicts: Array<Scalars['String']['output']>;
  merges: Array<Scalars['String']['output']>;
  result: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  checkoutBranch: BranchResult;
  commit: CommitResult;
  createBranch: BranchResult;
  createTag: TagResult;
  deleteBranch: BranchResult;
  mergeBranch: MergeOutcome;
  pull: RemoteResult;
  push: RemoteResult;
  pushTag: TagResult;
  stageAll: StageResult;
  stageFile: StageResult;
  unstageAll: StageResult;
  unstageFile: StageResult;
  writeFile: FileWriteResult;
};


export type MutationCheckoutBranchArgs = {
  name: Scalars['String']['input'];
};


export type MutationCommitArgs = {
  message: Scalars['String']['input'];
};


export type MutationCreateBranchArgs = {
  name: Scalars['String']['input'];
};


export type MutationCreateTagArgs = {
  name: Scalars['String']['input'];
};


export type MutationDeleteBranchArgs = {
  force?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
};


export type MutationMergeBranchArgs = {
  name: Scalars['String']['input'];
};


export type MutationPushTagArgs = {
  name: Scalars['String']['input'];
  remote?: InputMaybe<Scalars['String']['input']>;
};


export type MutationStageFileArgs = {
  path: Scalars['String']['input'];
};


export type MutationUnstageFileArgs = {
  path: Scalars['String']['input'];
};


export type MutationWriteFileArgs = {
  content: Scalars['String']['input'];
  expectedMtime?: InputMaybe<Scalars['String']['input']>;
  path: Scalars['String']['input'];
};

export type Query = {
  __typename?: 'Query';
  branches: Branches;
  commits: Array<Commit>;
  currentCommitHash: Scalars['String']['output'];
  defaultBranch: Scalars['String']['output'];
  diff: Scalars['String']['output'];
  filesChangedAgainstBranch: Array<FileStatus>;
  readFile: FileReadResult;
  repoInfo: RepoInfo;
  status: RepoStatus;
  tags: Array<Scalars['String']['output']>;
};


export type QueryCommitsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryDiffArgs = {
  options?: InputMaybe<DiffOptions>;
  path: Scalars['String']['input'];
};


export type QueryFilesChangedAgainstBranchArgs = {
  branch: Scalars['String']['input'];
};


export type QueryReadFileArgs = {
  path: Scalars['String']['input'];
};

export type RemoteResult = {
  __typename?: 'RemoteResult';
  success: Scalars['Boolean']['output'];
};

export type RepoInfo = {
  __typename?: 'RepoInfo';
  isRepo: Scalars['Boolean']['output'];
  repoRoot: Maybe<Scalars['String']['output']>;
};

export type RepoStatus = {
  __typename?: 'RepoStatus';
  ahead: Scalars['Int']['output'];
  behind: Scalars['Int']['output'];
  current: Scalars['String']['output'];
  files: Array<FileStatus>;
  isClean: Scalars['Boolean']['output'];
};

export type StageResult = {
  __typename?: 'StageResult';
  success: Scalars['Boolean']['output'];
};

export type TagResult = {
  __typename?: 'TagResult';
  success: Scalars['Boolean']['output'];
  tag: Maybe<Scalars['String']['output']>;
};

export type BranchesQueryVariables = Exact<{ [key: string]: never; }>;


export type BranchesQuery = { __typename?: 'Query', branches: { __typename?: 'Branches', current: string, all: Array<string>, branches: Array<{ __typename?: 'BranchDetail', name: string, commit: string, label: string, current: boolean }> } };

export type DefaultBranchQueryVariables = Exact<{ [key: string]: never; }>;


export type DefaultBranchQuery = { __typename?: 'Query', defaultBranch: string };

export type CreateBranchMutationVariables = Exact<{
  name: Scalars['String']['input'];
}>;


export type CreateBranchMutation = { __typename?: 'Mutation', createBranch: { __typename?: 'BranchResult', success: boolean, branch: string | null } };

export type CheckoutBranchMutationVariables = Exact<{
  name: Scalars['String']['input'];
}>;


export type CheckoutBranchMutation = { __typename?: 'Mutation', checkoutBranch: { __typename?: 'BranchResult', success: boolean, branch: string | null } };

export type DeleteBranchMutationVariables = Exact<{
  name: Scalars['String']['input'];
  force?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type DeleteBranchMutation = { __typename?: 'Mutation', deleteBranch: { __typename?: 'BranchResult', success: boolean, branch: string | null } };

export type MergeBranchMutationVariables = Exact<{
  name: Scalars['String']['input'];
}>;


export type MergeBranchMutation = { __typename?: 'Mutation', mergeBranch: { __typename?: 'MergeOutcome', success: boolean, merges: Array<string>, conflicts: Array<string>, result: string } };

export type DiffQueryVariables = Exact<{
  path: Scalars['String']['input'];
  options?: InputMaybe<DiffOptions>;
}>;


export type DiffQuery = { __typename?: 'Query', diff: string };

export type FilesChangedAgainstBranchQueryVariables = Exact<{
  branch: Scalars['String']['input'];
}>;


export type FilesChangedAgainstBranchQuery = { __typename?: 'Query', filesChangedAgainstBranch: Array<{ __typename?: 'FileStatus', path: string, workingDir: string, index: string, staged: boolean, statusText: string, color: string, hasLocalChanges: boolean | null }> };

export type ReadFileQueryVariables = Exact<{
  path: Scalars['String']['input'];
}>;


export type ReadFileQuery = { __typename?: 'Query', readFile: { __typename?: 'FileReadResult', content: string, mtime: string } };

export type WriteFileMutationVariables = Exact<{
  path: Scalars['String']['input'];
  content: Scalars['String']['input'];
  expectedMtime?: InputMaybe<Scalars['String']['input']>;
}>;


export type WriteFileMutation = { __typename?: 'Mutation', writeFile: { __typename?: 'FileWriteResult', success: boolean, conflict: boolean, message: string | null } };

export type StageFileMutationVariables = Exact<{
  path: Scalars['String']['input'];
}>;


export type StageFileMutation = { __typename?: 'Mutation', stageFile: { __typename?: 'StageResult', success: boolean } };

export type UnstageFileMutationVariables = Exact<{
  path: Scalars['String']['input'];
}>;


export type UnstageFileMutation = { __typename?: 'Mutation', unstageFile: { __typename?: 'StageResult', success: boolean } };

export type StageAllMutationVariables = Exact<{ [key: string]: never; }>;


export type StageAllMutation = { __typename?: 'Mutation', stageAll: { __typename?: 'StageResult', success: boolean } };

export type UnstageAllMutationVariables = Exact<{ [key: string]: never; }>;


export type UnstageAllMutation = { __typename?: 'Mutation', unstageAll: { __typename?: 'StageResult', success: boolean } };

export type PullMutationVariables = Exact<{ [key: string]: never; }>;


export type PullMutation = { __typename?: 'Mutation', pull: { __typename?: 'RemoteResult', success: boolean } };

export type PushMutationVariables = Exact<{ [key: string]: never; }>;


export type PushMutation = { __typename?: 'Mutation', push: { __typename?: 'RemoteResult', success: boolean } };

export type FileStatusFieldsFragment = { __typename?: 'FileStatus', path: string, workingDir: string, index: string, staged: boolean, statusText: string, color: string, hasLocalChanges: boolean | null };

export type RepoInfoQueryVariables = Exact<{ [key: string]: never; }>;


export type RepoInfoQuery = { __typename?: 'Query', repoInfo: { __typename?: 'RepoInfo', isRepo: boolean, repoRoot: string | null } };

export type StatusQueryVariables = Exact<{ [key: string]: never; }>;


export type StatusQuery = { __typename?: 'Query', status: { __typename?: 'RepoStatus', current: string, ahead: number, behind: number, isClean: boolean, files: Array<{ __typename?: 'FileStatus', path: string, workingDir: string, index: string, staged: boolean, statusText: string, color: string, hasLocalChanges: boolean | null }> } };

export type CommitsQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type CommitsQuery = { __typename?: 'Query', commits: Array<{ __typename?: 'Commit', hash: string, date: string, message: string, authorName: string, authorEmail: string }> };

export type CurrentCommitHashQueryVariables = Exact<{ [key: string]: never; }>;


export type CurrentCommitHashQuery = { __typename?: 'Query', currentCommitHash: string };

export type CommitMutationVariables = Exact<{
  message: Scalars['String']['input'];
}>;


export type CommitMutation = { __typename?: 'Mutation', commit: { __typename?: 'CommitResult', success: boolean, commit: string | null } };

export type TagsQueryVariables = Exact<{ [key: string]: never; }>;


export type TagsQuery = { __typename?: 'Query', tags: Array<string> };

export type CreateTagMutationVariables = Exact<{
  name: Scalars['String']['input'];
}>;


export type CreateTagMutation = { __typename?: 'Mutation', createTag: { __typename?: 'TagResult', success: boolean, tag: string | null } };

export type PushTagMutationVariables = Exact<{
  name: Scalars['String']['input'];
  remote?: InputMaybe<Scalars['String']['input']>;
}>;


export type PushTagMutation = { __typename?: 'Mutation', pushTag: { __typename?: 'TagResult', success: boolean, tag: string | null } };

export const FileStatusFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FileStatusFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FileStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"workingDir"}},{"kind":"Field","name":{"kind":"Name","value":"index"}},{"kind":"Field","name":{"kind":"Name","value":"staged"}},{"kind":"Field","name":{"kind":"Name","value":"statusText"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"hasLocalChanges"}}]}}]} as unknown as DocumentNode<FileStatusFieldsFragment, unknown>;
export const BranchesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Branches"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"branches"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"current"}},{"kind":"Field","name":{"kind":"Name","value":"all"}},{"kind":"Field","name":{"kind":"Name","value":"branches"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"commit"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"current"}}]}}]}}]}}]} as unknown as DocumentNode<BranchesQuery, BranchesQueryVariables>;
export const DefaultBranchDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"DefaultBranch"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"defaultBranch"}}]}}]} as unknown as DocumentNode<DefaultBranchQuery, DefaultBranchQueryVariables>;
export const CreateBranchDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateBranch"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createBranch"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"branch"}}]}}]}}]} as unknown as DocumentNode<CreateBranchMutation, CreateBranchMutationVariables>;
export const CheckoutBranchDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CheckoutBranch"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"checkoutBranch"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"branch"}}]}}]}}]} as unknown as DocumentNode<CheckoutBranchMutation, CheckoutBranchMutationVariables>;
export const DeleteBranchDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteBranch"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"force"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteBranch"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"force"},"value":{"kind":"Variable","name":{"kind":"Name","value":"force"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"branch"}}]}}]}}]} as unknown as DocumentNode<DeleteBranchMutation, DeleteBranchMutationVariables>;
export const MergeBranchDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MergeBranch"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mergeBranch"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"merges"}},{"kind":"Field","name":{"kind":"Name","value":"conflicts"}},{"kind":"Field","name":{"kind":"Name","value":"result"}}]}}]}}]} as unknown as DocumentNode<MergeBranchMutation, MergeBranchMutationVariables>;
export const DiffDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Diff"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"path"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"options"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"DiffOptions"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"diff"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"path"},"value":{"kind":"Variable","name":{"kind":"Name","value":"path"}}},{"kind":"Argument","name":{"kind":"Name","value":"options"},"value":{"kind":"Variable","name":{"kind":"Name","value":"options"}}}]}]}}]} as unknown as DocumentNode<DiffQuery, DiffQueryVariables>;
export const FilesChangedAgainstBranchDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"FilesChangedAgainstBranch"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"branch"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"filesChangedAgainstBranch"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"branch"},"value":{"kind":"Variable","name":{"kind":"Name","value":"branch"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FileStatusFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FileStatusFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FileStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"workingDir"}},{"kind":"Field","name":{"kind":"Name","value":"index"}},{"kind":"Field","name":{"kind":"Name","value":"staged"}},{"kind":"Field","name":{"kind":"Name","value":"statusText"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"hasLocalChanges"}}]}}]} as unknown as DocumentNode<FilesChangedAgainstBranchQuery, FilesChangedAgainstBranchQueryVariables>;
export const ReadFileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ReadFile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"path"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"readFile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"path"},"value":{"kind":"Variable","name":{"kind":"Name","value":"path"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"mtime"}}]}}]}}]} as unknown as DocumentNode<ReadFileQuery, ReadFileQueryVariables>;
export const WriteFileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"WriteFile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"path"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"content"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"expectedMtime"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"writeFile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"path"},"value":{"kind":"Variable","name":{"kind":"Name","value":"path"}}},{"kind":"Argument","name":{"kind":"Name","value":"content"},"value":{"kind":"Variable","name":{"kind":"Name","value":"content"}}},{"kind":"Argument","name":{"kind":"Name","value":"expectedMtime"},"value":{"kind":"Variable","name":{"kind":"Name","value":"expectedMtime"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"conflict"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<WriteFileMutation, WriteFileMutationVariables>;
export const StageFileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"StageFile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"path"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stageFile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"path"},"value":{"kind":"Variable","name":{"kind":"Name","value":"path"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}}]}}]}}]} as unknown as DocumentNode<StageFileMutation, StageFileMutationVariables>;
export const UnstageFileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UnstageFile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"path"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unstageFile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"path"},"value":{"kind":"Variable","name":{"kind":"Name","value":"path"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}}]}}]}}]} as unknown as DocumentNode<UnstageFileMutation, UnstageFileMutationVariables>;
export const StageAllDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"StageAll"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stageAll"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}}]}}]}}]} as unknown as DocumentNode<StageAllMutation, StageAllMutationVariables>;
export const UnstageAllDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UnstageAll"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unstageAll"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}}]}}]}}]} as unknown as DocumentNode<UnstageAllMutation, UnstageAllMutationVariables>;
export const PullDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Pull"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pull"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}}]}}]}}]} as unknown as DocumentNode<PullMutation, PullMutationVariables>;
export const PushDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Push"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"push"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}}]}}]}}]} as unknown as DocumentNode<PushMutation, PushMutationVariables>;
export const RepoInfoDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"RepoInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"repoInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"isRepo"}},{"kind":"Field","name":{"kind":"Name","value":"repoRoot"}}]}}]}}]} as unknown as DocumentNode<RepoInfoQuery, RepoInfoQueryVariables>;
export const StatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Status"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"current"}},{"kind":"Field","name":{"kind":"Name","value":"ahead"}},{"kind":"Field","name":{"kind":"Name","value":"behind"}},{"kind":"Field","name":{"kind":"Name","value":"isClean"}},{"kind":"Field","name":{"kind":"Name","value":"files"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FileStatusFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FileStatusFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FileStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"workingDir"}},{"kind":"Field","name":{"kind":"Name","value":"index"}},{"kind":"Field","name":{"kind":"Name","value":"staged"}},{"kind":"Field","name":{"kind":"Name","value":"statusText"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"hasLocalChanges"}}]}}]} as unknown as DocumentNode<StatusQuery, StatusQueryVariables>;
export const CommitsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Commits"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"commits"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hash"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"authorName"}},{"kind":"Field","name":{"kind":"Name","value":"authorEmail"}}]}}]}}]} as unknown as DocumentNode<CommitsQuery, CommitsQueryVariables>;
export const CurrentCommitHashDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CurrentCommitHash"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currentCommitHash"}}]}}]} as unknown as DocumentNode<CurrentCommitHashQuery, CurrentCommitHashQueryVariables>;
export const CommitDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Commit"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"message"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"commit"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"message"},"value":{"kind":"Variable","name":{"kind":"Name","value":"message"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"commit"}}]}}]}}]} as unknown as DocumentNode<CommitMutation, CommitMutationVariables>;
export const TagsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Tags"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"tags"}}]}}]} as unknown as DocumentNode<TagsQuery, TagsQueryVariables>;
export const CreateTagDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateTag"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createTag"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"tag"}}]}}]}}]} as unknown as DocumentNode<CreateTagMutation, CreateTagMutationVariables>;
export const PushTagDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"PushTag"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"remote"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pushTag"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"remote"},"value":{"kind":"Variable","name":{"kind":"Name","value":"remote"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"tag"}}]}}]}}]} as unknown as DocumentNode<PushTagMutation, PushTagMutationVariables>;