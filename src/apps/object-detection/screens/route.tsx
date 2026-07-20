import { lazy } from "react";
import type { RouteObject } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const ObjectDetectionScreen = lazy(() => import("./object-detection-screen"));

export const objectDetectionRoute: RouteObject = {
  path: "object-detection",
  element: (
    <>
      <Helmet>
        <title>Object Detection</title>
        <meta
          name="description"
          content="Real-time object detection in your browser powered by local AI."
        />
        <meta name="keywords" content="local ai, object detection, transformers, browser" />
        <meta property="og:title" content="Object Detection" />
        <meta
          property="og:description"
          content="Real-time object detection in your browser powered by local AI."
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Object Detection" />
        <meta
          name="twitter:description"
          content="Real-time object detection in your browser powered by local AI."
        />
      </Helmet>
      <ObjectDetectionScreen />
    </>
  ),
};
