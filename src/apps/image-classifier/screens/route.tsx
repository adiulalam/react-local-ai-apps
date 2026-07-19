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
        <meta
          name="description"
          content="Classify images securely in your browser using a local AI model."
        />
        <meta
          name="keywords"
          content="local ai, image classification, image recognition, browser"
        />
        <meta property="og:title" content="Image Classification" />
        <meta
          property="og:description"
          content="Classify images securely in your browser using a local AI model."
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Image Classification" />
        <meta
          name="twitter:description"
          content="Classify images securely in your browser using a local AI model."
        />
      </Helmet>
      <ImageClassifierScreen />
    </>
  ),
};
