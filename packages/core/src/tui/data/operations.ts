import type { ApolloClient } from "@opentui-git/client";
import type { TypedDocumentNode } from "@graphql-typed-document-node/core";

/**
 * Thin wrappers around `client.query` / `client.mutate` that consume the
 * codegen-generated TypedDocumentNodes and return the unwrapped `data` payload.
 *
 * Apollo's defaultOptions sets `errorPolicy: "all"`, so GraphQL errors come
 * back on `result.errors` rather than throwing. We surface them: a single
 * error becomes a regular Error (cause = the GraphQLError); multiple become
 * an AggregateError so none are silently dropped. Partial data is discarded.
 */

function throwGraphqlErrors(errors: ReadonlyArray<{ message: string }>): never {
  if (errors.length === 1) {
    const only = errors[0];
    throw new Error(only.message, { cause: only });
  }
  throw new AggregateError(
    errors.map((e) => new Error(e.message, { cause: e })),
    `GraphQL request failed with ${errors.length} errors`,
  );
}

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
  });
  if (result.error) throw result.error;
  if (result.errors && result.errors.length > 0) {
    throwGraphqlErrors(result.errors);
  }
  if (!result.data) {
    throw new Error("Query returned no data");
  }
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
    throwGraphqlErrors(result.errors);
  }
  if (!result.data) {
    throw new Error("Mutation returned no data");
  }
  return result.data;
}
