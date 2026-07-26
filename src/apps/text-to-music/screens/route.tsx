import { lazy } from "react";
import type { RouteObject } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const TextToMusicScreen = lazy(() => import("./text-to-music-screen"));

export const textToMusicRoute: RouteObject = {
  path: "text-to-music",
  element: (
    <>
      <Helmet>
        <title>Text to Music</title>
        <meta
          name="description"
          content="Generate AI music from text descriptions directly in your browser using MusicGen."
        />
        <meta name="keywords" content="local ai, text to music, musicgen, audio, browser, music" />
        <meta property="og:title" content="Text to Music" />
        <meta
          property="og:description"
          content="Generate AI music from text descriptions directly in your browser using MusicGen."
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Text to Music" />
        <meta
          name="twitter:description"
          content="Generate AI music from text descriptions directly in your browser using MusicGen."
        />
      </Helmet>
      <TextToMusicScreen />
    </>
  ),
};
