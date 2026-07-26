import { lazy } from "react";
import type { RouteObject } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const ImageDepthScreen = lazy(() => import("./image-depth-screen"));

export const imageDepthRoute: RouteObject = {
  path: "image-depth",
  element: (
    <>
      <Helmet>
        <title>Image Depth Estimation</title>
        <meta
          name="description"
          content="Estimate 3D depth maps instantly in your browser powered by local AI."
        />
        <meta
          name="keywords"
          content="local ai, depth estimation, depth map, depth anything, browser"
        />
        <meta property="og:title" content="Image Depth Estimation" />
        <meta
          property="og:description"
          content="Estimate 3D depth maps instantly in your browser powered by local AI."
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Image Depth Estimation" />
        <meta
          name="twitter:description"
          content="Estimate 3D depth maps instantly in your browser powered by local AI."
        />
      </Helmet>
      <ImageDepthScreen />
    </>
  ),
};
