import { lazy } from "react";
import type { RouteObject } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const Qwen3Screen = lazy(() => import("./qwen3-screen"));

export const qwen3Route: RouteObject = {
  path: "qwen3",
  element: (
    <>
      <Helmet>
        <title>Qwen 3 - 0.6B</title>
        <meta
          name="description"
          content="Chat with the Qwen 3 - 0.6B language model running entirely locally in your browser."
        />
        <meta name="keywords" content="local ai, qwen, llm, chatbot, browser, offline" />
        <meta property="og:title" content="Qwen 3 - 0.6B" />
        <meta
          property="og:description"
          content="Chat with the Qwen 3 - 0.6B language model running entirely locally in your browser."
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Qwen 3 - 0.6B" />
        <meta
          name="twitter:description"
          content="Chat with the Qwen 3 - 0.6B language model running entirely locally in your browser."
        />
      </Helmet>
      <Qwen3Screen />
    </>
  ),
};
