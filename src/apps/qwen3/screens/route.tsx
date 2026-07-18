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
      </Helmet>
      <Qwen3Screen />
    </>
  ),
};
