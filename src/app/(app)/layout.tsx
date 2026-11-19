import type { ReactNode } from "react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileBar } from "@/components/layout/mobile-bar";
import { TopBar } from "@/components/layout/top-bar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

/** App shell for every signed-in screen. Route protection lives in src/proxy.ts. */
export default function AppLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    // Tooltips label the sidebar icons when it's collapsed.
    <TooltipProvider delayDuration={0}>
      <SidebarProvider>
        <AppSidebar />
        {/* Content sits on the sidebar's tone; cards inside stay on bg-background. */}
        <SidebarInset className="bg-sidebar">
          <TopBar />
          {/* Bottom padding keeps content clear of the mobile bar. */}
          <div className="flex flex-1 flex-col p-4 pb-24 md:p-6">
            {children}
          </div>
        </SidebarInset>
        <MobileBar />
      </SidebarProvider>
    </TooltipProvider>
  );
}
