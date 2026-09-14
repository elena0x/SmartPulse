import { ReactNode } from "react";
import AppSidebar from "./AppSidebar";
import { useSidebarState } from "@/contexts/SidebarContext";

const AppLayout = ({ children }: { children: ReactNode }) => {
  const { collapsed } = useSidebarState();

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main
        className="p-6 transition-all duration-300"
        style={{ marginLeft: collapsed ? 68 : 240 }}
      >
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
