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
      </Helmet>
      <BackgroundRemoverScreen />
    </>
  ),
};
