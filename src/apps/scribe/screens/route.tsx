import { lazy } from "react";
import type { RouteObject } from "react-router-dom";

const ScribeScreen = lazy(() => import("./scribe-screen"));

export const scribeRoute: RouteObject = {
  path: "scribe",
  element: <ScribeScreen />,
};
