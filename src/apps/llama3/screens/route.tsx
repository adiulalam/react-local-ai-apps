import { lazy } from "react";
import type { RouteObject } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const Llama3Screen = lazy(() => import("./llama3-screen"));

export const llama3Route: RouteObject = {
  path: "llama3",
  element: (
    <>
      <Helmet>
        <title>Llama 3.2 - 1B</title>
        <meta
          name="description"
          content="Chat with the Llama 3.2 - 1B reasoning language model running entirely locally in your browser."
        />
        <meta name="keywords" content="local ai, llama, llm, chatbot, browser, offline" />
        <meta property="og:title" content="Llama 3.2 - 1B" />
        <meta
          property="og:description"
          content="Chat with the Llama 3.2 - 1B reasoning language model running entirely locally in your browser."
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Llama 3.2 - 1B" />
        <meta
          name="twitter:description"
          content="Chat with the Llama 3.2 - 1B reasoning language model running entirely locally in your browser."
        />
      </Helmet>
      <Llama3Screen />
    </>
  ),
};
