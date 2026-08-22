import { lazy } from "react";
import type { RouteObject } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const Gemma4Screen = lazy(() => import("./gemma4-screen"));

export const gemma4Route: RouteObject = {
  path: "gemma4",
  element: (
    <>
      <Helmet>
        <title>Gemma 4 - E2B</title>
        <meta
          name="description"
          content="Chat with the Gemma 4 - E2B language model running entirely locally in your browser."
        />
        <meta name="keywords" content="local ai, gemma, gemma4, llm, chatbot, browser, offline" />
        <meta property="og:title" content="Gemma 4 - E2B" />
        <meta
          property="og:description"
          content="Chat with the Gemma 4 - E2B language model running entirely locally in your browser."
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Gemma 4 - E2B" />
        <meta
          name="twitter:description"
          content="Chat with the Gemma 4 - E2B language model running entirely locally in your browser."
        />
      </Helmet>
      <Gemma4Screen />
    </>
  ),
};
