import { FieldPolicy, FieldReadFunction, TypePolicies, TypePolicy } from '@apollo/client/cache';
export type BranchDetailKeySpecifier = ('ahead' | 'behind' | 'commit' | 'current' | 'label' | 'name' | BranchDetailKeySpecifier)[];
export type BranchDetailFieldPolicy = {
	ahead?: FieldPolicy<any> | FieldReadFunction<any>,
	behind?: FieldPolicy<any> | FieldReadFunction<any>,
	commit?: FieldPolicy<any> | FieldReadFunction<any>,
	current?: FieldPolicy<any> | FieldReadFunction<any>,
	label?: FieldPolicy<any> | FieldReadFunction<any>,
	name?: FieldPolicy<any> | FieldReadFunction<any>
};
export type BranchResultKeySpecifier = ('branch' | 'success' | BranchResultKeySpecifier)[];
export type BranchResultFieldPolicy = {
	branch?: FieldPolicy<any> | FieldReadFunction<any>,
	success?: FieldPolicy<any> | FieldReadFunction<any>
};
export type BranchesKeySpecifier = ('all' | 'branches' | 'current' | BranchesKeySpecifier)[];
export type BranchesFieldPolicy = {
	all?: FieldPolicy<any> | FieldReadFunction<any>,
	branches?: FieldPolicy<any> | FieldReadFunction<any>,
	current?: FieldPolicy<any> | FieldReadFunction<any>
};
export type CommitKeySpecifier = ('authorEmail' | 'authorName' | 'date' | 'hash' | 'message' | CommitKeySpecifier)[];
export type CommitFieldPolicy = {
	authorEmail?: FieldPolicy<any> | FieldReadFunction<any>,
	authorName?: FieldPolicy<any> | FieldReadFunction<any>,
	date?: FieldPolicy<any> | FieldReadFunction<any>,
	hash?: FieldPolicy<any> | FieldReadFunction<any>,
	message?: FieldPolicy<any> | FieldReadFunction<any>
};
export type CommitResultKeySpecifier = ('commit' | 'success' | CommitResultKeySpecifier)[];
export type CommitResultFieldPolicy = {
	commit?: FieldPolicy<any> | FieldReadFunction<any>,
	success?: FieldPolicy<any> | FieldReadFunction<any>
};
export type FileReadResultKeySpecifier = ('content' | 'mtime' | FileReadResultKeySpecifier)[];
export type FileReadResultFieldPolicy = {
	content?: FieldPolicy<any> | FieldReadFunction<any>,
	mtime?: FieldPolicy<any> | FieldReadFunction<any>
};
export type FileStatusKeySpecifier = ('color' | 'hasLocalChanges' | 'index' | 'path' | 'staged' | 'statusText' | 'workingDir' | FileStatusKeySpecifier)[];
export type FileStatusFieldPolicy = {
	color?: FieldPolicy<any> | FieldReadFunction<any>,
	hasLocalChanges?: FieldPolicy<any> | FieldReadFunction<any>,
	index?: FieldPolicy<any> | FieldReadFunction<any>,
	path?: FieldPolicy<any> | FieldReadFunction<any>,
	staged?: FieldPolicy<any> | FieldReadFunction<any>,
	statusText?: FieldPolicy<any> | FieldReadFunction<any>,
	workingDir?: FieldPolicy<any> | FieldReadFunction<any>
};
export type FileWriteResultKeySpecifier = ('conflict' | 'message' | 'success' | FileWriteResultKeySpecifier)[];
export type FileWriteResultFieldPolicy = {
	conflict?: FieldPolicy<any> | FieldReadFunction<any>,
	message?: FieldPolicy<any> | FieldReadFunction<any>,
	success?: FieldPolicy<any> | FieldReadFunction<any>
};
export type MergeOutcomeKeySpecifier = ('conflicts' | 'merges' | 'result' | 'success' | MergeOutcomeKeySpecifier)[];
export type MergeOutcomeFieldPolicy = {
	conflicts?: FieldPolicy<any> | FieldReadFunction<any>,
	merges?: FieldPolicy<any> | FieldReadFunction<any>,
	result?: FieldPolicy<any> | FieldReadFunction<any>,
	success?: FieldPolicy<any> | FieldReadFunction<any>
};
export type MutationKeySpecifier = ('checkoutBranch' | 'commit' | 'createBranch' | 'createTag' | 'deleteBranch' | 'fetch' | 'forcePush' | 'mergeBranch' | 'pull' | 'push' | 'pushTag' | 'renameBranch' | 'stageAll' | 'stageFile' | 'stageFiles' | 'unstageAll' | 'unstageFile' | 'unstageFiles' | 'writeFile' | MutationKeySpecifier)[];
export type MutationFieldPolicy = {
	checkoutBranch?: FieldPolicy<any> | FieldReadFunction<any>,
	commit?: FieldPolicy<any> | FieldReadFunction<any>,
	createBranch?: FieldPolicy<any> | FieldReadFunction<any>,
	createTag?: FieldPolicy<any> | FieldReadFunction<any>,
	deleteBranch?: FieldPolicy<any> | FieldReadFunction<any>,
	fetch?: FieldPolicy<any> | FieldReadFunction<any>,
	forcePush?: FieldPolicy<any> | FieldReadFunction<any>,
	mergeBranch?: FieldPolicy<any> | FieldReadFunction<any>,
	pull?: FieldPolicy<any> | FieldReadFunction<any>,
	push?: FieldPolicy<any> | FieldReadFunction<any>,
	pushTag?: FieldPolicy<any> | FieldReadFunction<any>,
	renameBranch?: FieldPolicy<any> | FieldReadFunction<any>,
	stageAll?: FieldPolicy<any> | FieldReadFunction<any>,
	stageFile?: FieldPolicy<any> | FieldReadFunction<any>,
	stageFiles?: FieldPolicy<any> | FieldReadFunction<any>,
	unstageAll?: FieldPolicy<any> | FieldReadFunction<any>,
	unstageFile?: FieldPolicy<any> | FieldReadFunction<any>,
	unstageFiles?: FieldPolicy<any> | FieldReadFunction<any>,
	writeFile?: FieldPolicy<any> | FieldReadFunction<any>
};
export type QueryKeySpecifier = ('branches' | 'commits' | 'currentCommitHash' | 'defaultBranch' | 'diff' | 'filesChangedAgainstBranch' | 'readFile' | 'repoInfo' | 'repoPaths' | 'status' | 'tags' | QueryKeySpecifier)[];
export type QueryFieldPolicy = {
	branches?: FieldPolicy<any> | FieldReadFunction<any>,
	commits?: FieldPolicy<any> | FieldReadFunction<any>,
	currentCommitHash?: FieldPolicy<any> | FieldReadFunction<any>,
	defaultBranch?: FieldPolicy<any> | FieldReadFunction<any>,
	diff?: FieldPolicy<any> | FieldReadFunction<any>,
	filesChangedAgainstBranch?: FieldPolicy<any> | FieldReadFunction<any>,
	readFile?: FieldPolicy<any> | FieldReadFunction<any>,
	repoInfo?: FieldPolicy<any> | FieldReadFunction<any>,
	repoPaths?: FieldPolicy<any> | FieldReadFunction<any>,
	status?: FieldPolicy<any> | FieldReadFunction<any>,
	tags?: FieldPolicy<any> | FieldReadFunction<any>
};
export type RemoteResultKeySpecifier = ('success' | RemoteResultKeySpecifier)[];
export type RemoteResultFieldPolicy = {
	success?: FieldPolicy<any> | FieldReadFunction<any>
};
export type RepoInfoKeySpecifier = ('isRepo' | 'remoteUrl' | 'repoRoot' | RepoInfoKeySpecifier)[];
export type RepoInfoFieldPolicy = {
	isRepo?: FieldPolicy<any> | FieldReadFunction<any>,
	remoteUrl?: FieldPolicy<any> | FieldReadFunction<any>,
	repoRoot?: FieldPolicy<any> | FieldReadFunction<any>
};
export type RepoStatusKeySpecifier = ('ahead' | 'behind' | 'current' | 'files' | 'isClean' | RepoStatusKeySpecifier)[];
export type RepoStatusFieldPolicy = {
	ahead?: FieldPolicy<any> | FieldReadFunction<any>,
	behind?: FieldPolicy<any> | FieldReadFunction<any>,
	current?: FieldPolicy<any> | FieldReadFunction<any>,
	files?: FieldPolicy<any> | FieldReadFunction<any>,
	isClean?: FieldPolicy<any> | FieldReadFunction<any>
};
export type StageResultKeySpecifier = ('success' | StageResultKeySpecifier)[];
export type StageResultFieldPolicy = {
	success?: FieldPolicy<any> | FieldReadFunction<any>
};
export type TagResultKeySpecifier = ('success' | 'tag' | TagResultKeySpecifier)[];
export type TagResultFieldPolicy = {
	success?: FieldPolicy<any> | FieldReadFunction<any>,
	tag?: FieldPolicy<any> | FieldReadFunction<any>
};
export type StrictTypedTypePolicies = {
	BranchDetail?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | BranchDetailKeySpecifier | (() => undefined | BranchDetailKeySpecifier),
		fields?: BranchDetailFieldPolicy,
	},
	BranchResult?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | BranchResultKeySpecifier | (() => undefined | BranchResultKeySpecifier),
		fields?: BranchResultFieldPolicy,
	},
	Branches?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | BranchesKeySpecifier | (() => undefined | BranchesKeySpecifier),
		fields?: BranchesFieldPolicy,
	},
	Commit?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | CommitKeySpecifier | (() => undefined | CommitKeySpecifier),
		fields?: CommitFieldPolicy,
	},
	CommitResult?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | CommitResultKeySpecifier | (() => undefined | CommitResultKeySpecifier),
		fields?: CommitResultFieldPolicy,
	},
	FileReadResult?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | FileReadResultKeySpecifier | (() => undefined | FileReadResultKeySpecifier),
		fields?: FileReadResultFieldPolicy,
	},
	FileStatus?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | FileStatusKeySpecifier | (() => undefined | FileStatusKeySpecifier),
		fields?: FileStatusFieldPolicy,
	},
	FileWriteResult?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | FileWriteResultKeySpecifier | (() => undefined | FileWriteResultKeySpecifier),
		fields?: FileWriteResultFieldPolicy,
	},
	MergeOutcome?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | MergeOutcomeKeySpecifier | (() => undefined | MergeOutcomeKeySpecifier),
		fields?: MergeOutcomeFieldPolicy,
	},
	Mutation?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | MutationKeySpecifier | (() => undefined | MutationKeySpecifier),
		fields?: MutationFieldPolicy,
	},
	Query?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | QueryKeySpecifier | (() => undefined | QueryKeySpecifier),
		fields?: QueryFieldPolicy,
	},
	RemoteResult?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | RemoteResultKeySpecifier | (() => undefined | RemoteResultKeySpecifier),
		fields?: RemoteResultFieldPolicy,
	},
	RepoInfo?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | RepoInfoKeySpecifier | (() => undefined | RepoInfoKeySpecifier),
		fields?: RepoInfoFieldPolicy,
	},
	RepoStatus?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | RepoStatusKeySpecifier | (() => undefined | RepoStatusKeySpecifier),
		fields?: RepoStatusFieldPolicy,
	},
	StageResult?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | StageResultKeySpecifier | (() => undefined | StageResultKeySpecifier),
		fields?: StageResultFieldPolicy,
	},
	TagResult?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | TagResultKeySpecifier | (() => undefined | TagResultKeySpecifier),
		fields?: TagResultFieldPolicy,
	}
};
export type TypedTypePolicies = StrictTypedTypePolicies & TypePolicies;