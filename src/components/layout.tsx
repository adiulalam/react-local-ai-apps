import { Link, Outlet } from "react-router-dom";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Suspense } from "react";
import { Muted } from "@/components/ui/typography";

export function Layout() {
  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <header className="bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
        <div className="container flex h-14 items-center px-4">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink
                  render={<Link to="/scribe" />}
                  className={navigationMenuTriggerStyle()}
                  active={location.pathname.startsWith("/scribe")}
                >
                  Local Scribe
                </NavigationMenuLink>
              </NavigationMenuItem>
              {/* Future apps will be added here */}
            </NavigationMenuList>
          </NavigationMenu>
        </div>
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
}
