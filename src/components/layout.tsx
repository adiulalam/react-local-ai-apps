import { Link, Outlet, useLocation } from "react-router-dom";
import {
  Mic,
  Image as ImageIcon,
  Eraser,
  MessageSquare,
  Headphones,
  Layers,
  Video,
  Focus,
  PiggyBank,
  Type,
  Box,
} from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Suspense } from "react";
import { Muted } from "@/components/ui/typography";
import { ModeToggle } from "@/components/mode-toggle";
import { Qwen } from "@/components/icons/qwen";
import { Deepseek } from "@/components/icons/deepseek";
import { Llama } from "@/components/icons/llama";

export const Layout = () => {
  const location = useLocation();

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <header className="flex h-14 w-full items-center justify-between border-b px-4">
        <NavigationMenu>
          <NavigationMenuList className="gap-2" aria-orientation={undefined}>
            {/* Audio Group */}
            <NavigationMenuItem>
              <NavigationMenuTrigger className="gap-2" aria-label="Audio">
                <Headphones className="size-4" />
                <span className="hidden md:block">Audio</span>
              </NavigationMenuTrigger>
              <NavigationMenuContent className="flex min-w-50 flex-col gap-1 p-2">
                <NavigationMenuLink
                  render={<Link to="/scribe" />}
                  className="w-full justify-start"
                  active={location.pathname.startsWith("/scribe")}
                >
                  <Mic className="size-4" />
                  Local Scribe
                </NavigationMenuLink>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Image Group */}
            <NavigationMenuItem>
              <NavigationMenuTrigger className="gap-2" aria-label="Image">
                <Layers className="size-4" />
                <span className="hidden md:block">Image</span>
              </NavigationMenuTrigger>
              <NavigationMenuContent className="flex min-w-50 flex-col gap-1 p-2">
                <NavigationMenuLink
                  render={<Link to="/image-classifier" />}
                  className="w-full justify-start"
                  active={location.pathname.startsWith("/image-classifier")}
                >
                  <ImageIcon className="size-4" />
                  Image Classification
                </NavigationMenuLink>
                <NavigationMenuLink
                  render={<Link to="/background-remover" />}
                  className="w-full justify-start"
                  active={location.pathname.startsWith("/background-remover")}
                >
                  <Eraser className="size-4" />
                  Background Remover
                </NavigationMenuLink>
                <NavigationMenuLink
                  render={<Link to="/image-depth" />}
                  className="w-full justify-start"
                  active={location.pathname.startsWith("/image-depth")}
                >
                  <Box className="size-4" />
                  Image Depth
                </NavigationMenuLink>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Video Group */}
            <NavigationMenuItem>
              <NavigationMenuTrigger className="gap-2" aria-label="Video">
                <Video className="size-4" />
                <span className="hidden md:block">Video</span>
              </NavigationMenuTrigger>
              <NavigationMenuContent className="flex min-w-50 flex-col gap-1 p-2">
                <NavigationMenuLink
                  render={<Link to="/object-detection" />}
                  className="w-full justify-start"
                  active={location.pathname.startsWith("/object-detection")}
                >
                  <Focus className="size-4" />
                  Object Detection
                </NavigationMenuLink>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Text Group */}
            <NavigationMenuItem>
              <NavigationMenuTrigger className="gap-2" aria-label="Text">
                <Type className="size-4" />
                <span className="hidden md:block">Text</span>
              </NavigationMenuTrigger>
              <NavigationMenuContent className="flex min-w-50 flex-col gap-1 p-2">
                <NavigationMenuLink
                  render={<Link to="/tokenizer-playground" />}
                  className="w-full justify-start"
                  active={location.pathname.startsWith("/tokenizer-playground")}
                >
                  <PiggyBank className="size-4" />
                  Tokenizer Playground
                </NavigationMenuLink>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Chat Group */}
            <NavigationMenuItem>
              <NavigationMenuTrigger className="gap-2" aria-label="Chat">
                <MessageSquare className="size-4" />
                <span className="hidden md:block">Chat</span>
              </NavigationMenuTrigger>
              <NavigationMenuContent className="flex min-w-50 flex-col gap-1 p-2">
                <NavigationMenuLink
                  render={<Link to="/qwen3" />}
                  className="w-full justify-start"
                  active={location.pathname.startsWith("/qwen3")}
                >
                  <Qwen className="size-4" />
                  Qwen 3 - 0.6B
                </NavigationMenuLink>
                <NavigationMenuLink
                  render={<Link to="/deepseek" />}
                  className="w-full justify-start"
                  active={location.pathname.startsWith("/deepseek")}
                >
                  <Deepseek className="size-4" />
                  DeepSeek R1 - 1.5B
                </NavigationMenuLink>
                <NavigationMenuLink
                  render={<Link to="/llama3" />}
                  className="w-full justify-start"
                  active={location.pathname.startsWith("/llama3")}
                >
                  <Llama className="size-4" />
                  Llama 3.2 - 1B
                </NavigationMenuLink>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <ModeToggle />
      </header>

      <main className="flex-1 overflow-auto">
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center p-8">
              <Muted>Loading...</Muted>
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
};
