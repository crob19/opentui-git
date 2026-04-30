import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";

import { schema } from "./schema/index.js";
import { buildContext, type Context } from "./infra/context.js";

const cwdArgIndex = process.argv.indexOf("--cwd");
const cwd =
  cwdArgIndex >= 0 && process.argv[cwdArgIndex + 1]
    ? process.argv[cwdArgIndex + 1]
    : process.cwd();

const portEnv = process.env.PORT;
const port = portEnv ? Number(portEnv) : 4000;

const server = new ApolloServer<Context>({ schema });

const { url } = await startStandaloneServer(server, {
  listen: { port, host: "127.0.0.1" },
  context: async () => buildContext(cwd),
});

// Emit a structured line so a parent process (e.g. the TUI) can capture
// the chosen URL when it spawns this binary on port 0.
console.log(JSON.stringify({ type: "ready", url, cwd }));
