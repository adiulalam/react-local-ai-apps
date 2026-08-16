import { lazy } from "react";
import type { RouteObject } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const VideoDescriberScreen = lazy(() => import("./video-describer-screen"));

export const videoDescriberRoute: RouteObject = {
  path: "video-describer",
  element: (
    <>
      <Helmet>
        <title>Video Describer</title>
        <meta
          name="description"
          content="Real-time visual scene narration and audio description powered by local AI."
        />
        <meta
          name="keywords"
          content="local ai, video describer, image-to-text, text-to-speech, accessibility, transformers, browser"
        />
        <meta property="og:title" content="Video Describer" />
        <meta
          property="og:description"
          content="Real-time visual scene narration and audio description powered by local AI."
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Video Describer" />
        <meta
          name="twitter:description"
          content="Real-time visual scene narration and audio description powered by local AI."
        />
      </Helmet>
      <VideoDescriberScreen />
    </>
  ),
};
