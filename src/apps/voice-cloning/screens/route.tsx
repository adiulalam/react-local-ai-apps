import { lazy } from "react";
import type { RouteObject } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const VoiceCloningScreen = lazy(() => import("./voice-cloning-screen"));

export const voiceCloningRoute: RouteObject = {
  path: "voice-cloning",
  element: (
    <>
      <Helmet>
        <title>Voice Cloning</title>
        <meta
          name="description"
          content="Zero-shot AI voice cloning and speech synthesis directly in your browser using Chatterbox."
        />
        <meta
          name="keywords"
          content="local ai, voice cloning, tts, speech synthesis, chatterbox, browser, audio"
        />
        <meta property="og:title" content="Voice Cloning" />
        <meta
          property="og:description"
          content="Zero-shot AI voice cloning and speech synthesis directly in your browser using Chatterbox."
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Voice Cloning" />
        <meta
          name="twitter:description"
          content="Zero-shot AI voice cloning and speech synthesis directly in your browser using Chatterbox."
        />
      </Helmet>
      <VoiceCloningScreen />
    </>
  ),
};
