import { lazy } from "react";
import type { RouteObject } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const SemanticSearchScreen = lazy(() => import("./semantic-search-screen"));

export const semanticSearchRoute: RouteObject = {
  path: "semantic-search",
  element: (
    <>
      <Helmet>
        <title>Semantic Search (RAG)</title>
        <meta
          name="description"
          content="Local in-browser semantic search, vector indexing, and grounded RAG document chat completely offline."
        />
        <meta
          name="keywords"
          content="local ai, semantic search, rag, embeddings, vector search, document chat, transformers.js"
        />
        <meta property="og:title" content="Semantic Search (RAG)" />
        <meta
          property="og:description"
          content="Local in-browser semantic search, vector indexing, and grounded RAG document chat completely offline."
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Semantic Search (RAG)" />
        <meta
          name="twitter:description"
          content="Local in-browser semantic search, vector indexing, and grounded RAG document chat completely offline."
        />
      </Helmet>
      <SemanticSearchScreen />
    </>
  ),
};
