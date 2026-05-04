import type { ApolloClient } from "@opentui-git/client";
import type { TypedDocumentNode } from "@graphql-typed-document-node/core";

/**
 * Thin wrappers around `client.query` / `client.mutate` that consume the
 * codegen-generated TypedDocumentNodes and return the unwrapped `data` payload.
 *
 * These exist so call sites read like `await runQuery(client, StatusDocument)`
 * instead of `(await client.query({ query: StatusDocument })).data`. They are
 * NOT a hand-rolled SDK — there's no per-operation method here. Solid hooks
 * codegen would replace these entirely; until then this is the minimum sugar.
 */

export async function runQuery<
  TData,
  TVariables extends Record<string, unknown> | undefined,
>(
  client: ApolloClient<unknown>,
  document: TypedDocumentNode<TData, TVariables>,
  variables?: TVariables,
): Promise<TData> {
  const result = await client.query({
    query: document,
    variables,
    fetchPolicy: "network-only",
  });
  if (result.error) throw result.error;
  return result.data;
}

export async function runMutation<
  TData,
  TVariables extends Record<string, unknown> | undefined,
>(
  client: ApolloClient<unknown>,
  document: TypedDocumentNode<TData, TVariables>,
  variables?: TVariables,
): Promise<TData> {
  const result = await client.mutate({
    mutation: document,
    variables,
  });
  if (result.errors && result.errors.length > 0) {
    throw result.errors[0];
  }
  if (!result.data) {
    throw new Error("Mutation returned no data");
  }
  return result.data;
}
