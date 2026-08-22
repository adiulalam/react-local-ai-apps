import { lazy } from "react";
import type { RouteObject } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const Gemma3Screen = lazy(() => import("./gemma3-screen"));

export const gemma3Route: RouteObject = {
  path: "gemma3",
  element: (
    <>
      <Helmet>
        <title>Gemma 3 - 1B</title>
        <meta
          name="description"
          content="Chat with the Gemma 3 - 1B language model running entirely locally in your browser."
        />
        <meta name="keywords" content="local ai, gemma, gemma3, llm, chatbot, browser, offline" />
        <meta property="og:title" content="Gemma 3 - 1B" />
        <meta
          property="og:description"
          content="Chat with the Gemma 3 - 1B language model running entirely locally in your browser."
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Gemma 3 - 1B" />
        <meta
          name="twitter:description"
          content="Chat with the Gemma 3 - 1B language model running entirely locally in your browser."
        />
      </Helmet>
      <Gemma3Screen />
    </>
  ),
};
