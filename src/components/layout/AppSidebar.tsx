import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Zap,
  ClipboardList,
  Database,
  Tags,
  ChevronLeft,
  ChevronRight,
  Activity,
  Gauge,
  LogOut,
} from "lucide-react";
import SignalCenter from "./SignalCenter";
import { useAuth } from "@/contexts/AuthContext";
import { useSidebarState } from "@/contexts/SidebarContext";

const navGroups = [
  {
    label: "洞察",
    items: [
      { icon: LayoutDashboard, label: "全局总览", path: "/" },
      { icon: Gauge, label: "策略监控", path: "/cockpit" },
    ],
  },
  {
    label: "行动",
    items: [
      { icon: Zap, label: "智能线索", path: "/feed" },
    ],
  },
  {
    label: "数据",
    items: [
      { icon: ClipboardList, label: "HCP主数据", path: "/hcp-list" },
      { icon: Database, label: "业务数据", path: "/business-data" },
      { icon: Tags, label: "标签管理", path: "/tag-management" },
    ],
  },
];

const AppSidebar = () => {
  const { collapsed, toggle } = useSidebarState();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col z-50 transition-all duration-300 ${
        collapsed ? "w-[68px]" : "w-[240px]"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
          <Activity className="w-4 h-4 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden flex-1">
            <h1 className="text-sm font-bold text-sidebar-primary-foreground tracking-wide">
              SmartPulse
            </h1>
            <p className="text-[10px] text-sidebar-foreground opacity-60">
              数字化营销引擎
            </p>
          </div>
        )}
        {/* Signal Center icon */}
        {!collapsed && <SignalCenter />}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-4">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                {group.label}
              </p>
            )}
            {collapsed && <div className="mx-auto mb-1 w-6 border-t border-sidebar-border" />}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    title={collapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      collapsed ? "justify-center" : ""
                    } ${
                      isActive
                        ? "bg-sidebar-accent text-sidebar-primary"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }`}
                  >
                    <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User & Controls */}
      <div className="px-2 pb-4 space-y-1">
        {!collapsed && user && (
          <div className="px-3 py-2 text-xs text-sidebar-foreground truncate opacity-70">
            {user.email}
          </div>
        )}
        <button
          onClick={signOut}
          title={collapsed ? "退出登录" : undefined}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-destructive transition-colors"
        >
          <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
          {!collapsed && <span>退出登录</span>}
        </button>
        <button
          onClick={toggle}
          className="w-full p-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors flex items-center justify-center"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;
