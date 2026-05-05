# @opentui-git/client

Framework-agnostic GraphQL client for the `@opentui-git/server` API. Consumed today by the TUI in `@opentui-git/core`; designed so a future Electron renderer or web client can share the same data layer without pulling in OpenTUI, SolidJS, or `simple-git`.

## Usage

```ts
import { createHttpClient } from "@opentui-git/client";

const client = createHttpClient({ endpoint: "http://127.0.0.1:4000/" });
const status = await client.getStatus();
```

## Future work

- **Multi-repo / cwd switching.** The server currently binds its `GitService` to one cwd at startup. For an Electron app where the user may switch repos at runtime, we need to either restart the server per repo or thread `cwd` through every operation (e.g. `Query.status(cwd: String!)`).
- **Subscriptions.** The server is HTTP-only today. Live status/branches updates will arrive via `graphql-ws` (or polling at the consumer's reactivity layer) in a follow-up.
