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
      </Helmet>
      <ScribeScreen />
    </>
  ),
};
