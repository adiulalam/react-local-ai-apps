import { lazy } from "react";
import type { RouteObject } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const TokenizerScreen = lazy(() => import("./tokenizer-screen"));

export const tokenizerRoute: RouteObject = {
  path: "tokenizer-playground",
  element: (
    <>
      <Helmet>
        <title>Tokenizer Playground</title>
        <meta
          name="description"
          content="Experiment with different tokenizers running entirely locally in your browser."
        />
        <meta name="keywords" content="local ai, tokenizer, llm, browser, offline, huggingface" />
        <meta property="og:title" content="Tokenizer Playground" />
        <meta
          property="og:description"
          content="Experiment with different tokenizers running entirely locally in your browser."
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Tokenizer Playground" />
        <meta
          name="twitter:description"
          content="Experiment with different tokenizers running entirely locally in your browser."
        />
      </Helmet>
      <TokenizerScreen />
    </>
  ),
};
