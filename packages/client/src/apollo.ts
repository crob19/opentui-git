import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  type NormalizedCacheObject,
} from "@apollo/client/core/index.js";

export interface CreateClientOptions {
  /** GraphQL endpoint URL. The server's `ready` line emits a base URL like `http://127.0.0.1:4000/`. */
  endpoint: string;
  /** Optional fetch override (Electron renderer / Node test harness / etc). */
  fetch?: typeof fetch;
  /** Extra headers (auth, etc.). */
  headers?: Record<string, string>;
}

/**
 * Build a configured ApolloClient instance pointed at an opentui-git server.
 *
 * Intentionally minimal today (single HttpLink, default InMemoryCache). When
 * we add subscriptions, persisted queries, batching, or auth retry, those
 * links/policies belong here so every consumer (TUI, Electron renderer, web)
 * picks them up uniformly.
 */
export function createClient(
  options: CreateClientOptions,
): ApolloClient<NormalizedCacheObject> {
  const link = new HttpLink({
    uri: options.endpoint,
    fetch: options.fetch,
    headers: options.headers,
  });

  return new ApolloClient({
    link,
    cache: new InMemoryCache(),
    // Default to network-first for queries; the TUI polls and cares about
    // freshness. Individual call sites can override.
    defaultOptions: {
      query: { fetchPolicy: "network-only", errorPolicy: "all" },
      watchQuery: { fetchPolicy: "cache-and-network", errorPolicy: "all" },
      mutate: { errorPolicy: "all" },
    },
  });
}

export type { ApolloClient, NormalizedCacheObject };
