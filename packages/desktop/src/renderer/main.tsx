import React from "react";
import ReactDOM from "react-dom/client";
import { ApolloProvider } from "@apollo/client/react/index.js";
import { createClient } from "@opentui-git/client";

import { App } from "./App.js";

const endpoint =
  import.meta.env.VITE_GRAPHQL_ENDPOINT ?? "http://127.0.0.1:4000/";

const client = createClient({ endpoint, fetch: window.fetch.bind(window) });

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </React.StrictMode>,
);
