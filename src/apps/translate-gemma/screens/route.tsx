import { lazy } from "react";
import type { RouteObject } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const TranslateGemmaScreen = lazy(() => import("./translate-gemma-screen"));

export const translateGemmaRoute: RouteObject = {
  path: "translate-gemma",
  element: (
    <>
      <Helmet>
        <title>TranslateGemma</title>
        <meta
          name="description"
          content="Private local browser translation powered by TranslateGemma WebGPU."
        />
        <meta
          name="keywords"
          content="local ai, translategemma, gemma, translation, webgpu, browser, offline"
        />
        <meta property="og:title" content="TranslateGemma" />
        <meta
          property="og:description"
          content="Private local browser translation powered by TranslateGemma WebGPU."
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="TranslateGemma" />
        <meta
          name="twitter:description"
          content="Private local browser translation powered by TranslateGemma WebGPU."
        />
      </Helmet>
      <TranslateGemmaScreen />
    </>
  ),
};
