import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { Layout } from "@/components/layout";
import { scribeRoute } from "@/apps/scribe/screens/route";
import { textToMusicRoute } from "@/apps/text-to-music/screens/route";
import { imageClassifierRoute } from "@/apps/image-classifier/screens/route";
import { backgroundRemoverRoute } from "@/apps/background-remover/screens/route";
import { imageDepthRoute } from "@/apps/image-depth/screens/route";
import { qwen3Route } from "@/apps/qwen3/screens/route";
import { deepseekRoute } from "@/apps/deepseek/screens/route";
import { llama3Route } from "@/apps/llama3/screens/route";
import { objectDetectionRoute } from "@/apps/object-detection/screens/route";
import { tokenizerRoute } from "@/apps/tokenizer-playground/screens/route";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Navigate to="/scribe" replace />,
      },
      scribeRoute,
      textToMusicRoute,
      imageClassifierRoute,
      backgroundRemoverRoute,
      imageDepthRoute,
      qwen3Route,
      deepseekRoute,
      llama3Route,
      objectDetectionRoute,
      tokenizerRoute,
    ],
  },
]);

const App = () => {
  return <RouterProvider router={router} />;
};

export default App;
