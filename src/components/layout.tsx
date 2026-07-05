import { Link, Outlet } from "react-router-dom";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Suspense } from "react";

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-4">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link to="/scribe" className={navigationMenuTriggerStyle()}>
                  Local Scribe
                </Link>
              </NavigationMenuItem>
              {/* Future apps will be added here */}
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        <Suspense fallback={<div className="flex items-center justify-center h-full p-8 text-muted-foreground">Loading...</div>}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
