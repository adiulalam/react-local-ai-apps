import { lazy } from "react";
import type { RouteObject } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const ImageClassifierScreen = lazy(() => import("./image-classifier-screen"));

export const imageClassifierRoute: RouteObject = {
  path: "image-classifier",
  element: (
    <>
      <Helmet>
        <title>Image Classification</title>
      </Helmet>
      <ImageClassifierScreen />
    </>
  ),
};
