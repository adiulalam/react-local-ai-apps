import { lazy } from "react";
import type { RouteObject } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const BackgroundRemoverScreen = lazy(() => import("./background-remover-screen"));

export const backgroundRemoverRoute: RouteObject = {
  path: "background-remover",
  element: (
    <>
      <Helmet>
        <title>Background Remover</title>
        <meta name="description" content="Remove image backgrounds instantly in your browser powered by local AI." />
        <meta name="keywords" content="local ai, background remover, image editing, browser" />
        <meta property="og:title" content="Background Remover" />
        <meta property="og:description" content="Remove image backgrounds instantly in your browser powered by local AI." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Background Remover" />
        <meta name="twitter:description" content="Remove image backgrounds instantly in your browser powered by local AI." />
      </Helmet>
      <BackgroundRemoverScreen />
    </>
  ),
};
