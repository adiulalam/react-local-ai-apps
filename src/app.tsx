import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { Layout } from "@/components/layout";
import { scribeRoute } from "@/apps/scribe/screens/route";
import { imageClassifierRoute } from "@/apps/image-classifier/screens/route";
import { backgroundRemoverRoute } from "@/apps/background-remover/screens/route";
import { qwen3Route } from "@/apps/qwen3/screens/route";

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
      imageClassifierRoute,
      backgroundRemoverRoute,
      qwen3Route,
    ],
  },
]);

const App = () => {
  return <RouterProvider router={router} />;
};

export default App;
