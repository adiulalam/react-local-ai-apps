import { Link, Outlet, useLocation } from "react-router-dom";
import { Mic, Image as ImageIcon, Eraser } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Suspense } from "react";
import { Muted } from "@/components/ui/typography";
import { ModeToggle } from "@/components/mode-toggle";

export const Layout = () => {
  const location = useLocation();

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <header className="flex h-14 w-full items-center justify-between border-b px-4">
        <NavigationMenu>
          <NavigationMenuList className="gap-4">
            <NavigationMenuItem>
              <NavigationMenuLink
                render={<Link to="/scribe" />}
                className={navigationMenuTriggerStyle()}
                active={location.pathname.startsWith("/scribe")}
              >
                <Mic />
                Local Scribe
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                render={<Link to="/image-classifier" />}
                className={navigationMenuTriggerStyle()}
                active={location.pathname.startsWith("/image-classifier")}
              >
                <ImageIcon />
                Image Classification
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                render={<Link to="/background-remover" />}
                className={navigationMenuTriggerStyle()}
                active={location.pathname.startsWith("/background-remover")}
              >
                <Eraser />
                Background Remover
              </NavigationMenuLink>
            </NavigationMenuItem>
            {/* Future apps will be added here */}
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
