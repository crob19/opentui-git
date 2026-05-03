import { loadFilesSync } from "@graphql-tools/load-files";
import { mergeResolvers, mergeTypeDefs } from "@graphql-tools/merge";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { repoResolvers } from "../domains/repo/index.js";
import { branchResolvers } from "../domains/branch/index.js";
import { tagResolvers } from "../domains/tag/index.js";
import { diffResolvers } from "../domains/diff/index.js";
import { fileResolvers } from "../domains/file/index.js";
import { remoteResolvers } from "../domains/remote/index.js";

const here = dirname(fileURLToPath(import.meta.url));
const srcRoot = resolve(here, "..");

const typeDefs = mergeTypeDefs(loadFilesSync(`${srcRoot}/**/*.graphql`));

const resolvers = mergeResolvers([
  repoResolvers,
  branchResolvers,
  tagResolvers,
  diffResolvers,
  fileResolvers,
  remoteResolvers,
]);

export const schema = makeExecutableSchema({ typeDefs, resolvers });
