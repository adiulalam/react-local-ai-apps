import { lazy } from "react";
import type { RouteObject } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const ScribeScreen = lazy(() => import("./scribe-screen"));

export const scribeRoute: RouteObject = {
  path: "scribe",
  element: (
    <>
      <Helmet>
        <title>Local Scribe</title>
        <meta
          name="description"
          content="Transcribe audio directly in your browser using local AI."
        />
        <meta name="keywords" content="local ai, transcribe, audio, browser, scribe" />
        <meta property="og:title" content="Local Scribe" />
        <meta
          property="og:description"
          content="Transcribe audio directly in your browser using local AI."
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Local Scribe" />
        <meta
          name="twitter:description"
          content="Transcribe audio directly in your browser using local AI."
        />
      </Helmet>
      <ScribeScreen />
    </>
  ),
};
