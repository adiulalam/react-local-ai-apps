import { lazy } from "react";
import type { RouteObject } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const DeepseekScreen = lazy(() => import("./deepseek-screen"));

export const deepseekRoute: RouteObject = {
  path: "deepseek",
  element: (
    <>
      <Helmet>
        <title>DeepSeek R1 - 1.5B</title>
        <meta
          name="description"
          content="Chat with the DeepSeek R1 - 1.5B language model running entirely locally in your browser."
        />
        <meta name="keywords" content="local ai, deepseek, llm, chatbot, browser, offline" />
        <meta property="og:title" content="DeepSeek R1 - 1.5B" />
        <meta
          property="og:description"
          content="Chat with the DeepSeek R1 - 1.5B language model running entirely locally in your browser."
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="DeepSeek R1 - 1.5B" />
        <meta
          name="twitter:description"
          content="Chat with the DeepSeek R1 - 1.5B language model running entirely locally in your browser."
        />
      </Helmet>
      <DeepseekScreen />
    </>
  ),
};
