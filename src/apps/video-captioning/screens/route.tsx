import { lazy } from "react";
import type { RouteObject } from "react-router-dom";

const VideoCaptioningScreen = lazy(() => import("./video-captioning-screen"));

export const videoCaptioningRoute: RouteObject = {
  path: "video-captioning",
  element: <VideoCaptioningScreen />,
};
