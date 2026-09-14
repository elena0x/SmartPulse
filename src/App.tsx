import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AlertConfigProvider } from "@/contexts/AlertConfigContext";
import { SidebarStateProvider } from "@/contexts/SidebarContext";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
const Dashboard = lazy(() => import("./pages/Dashboard"));
const IntelFeed = lazy(() => import("./pages/IntelFeed"));
const HCPList = lazy(() => import("./pages/HCPList"));
const HCPDetail = lazy(() => import("./pages/HCPDetail"));
const MyCockpit = lazy(() => import("./pages/MyCockpit"));
const BusinessData = lazy(() => import("./pages/BusinessData"));
const TagManagement = lazy(() => import("./pages/TagManagement"));
const TagDetail = lazy(() => import("./pages/TagDetail"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="w-8 h-8 animate-spin text-primary" aria-label="Loading page" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
    <AlertConfigProvider>
    <SidebarStateProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/feed" element={<ProtectedRoute><IntelFeed /></ProtectedRoute>} />
            <Route path="/hcp-list" element={<ProtectedRoute><HCPList /></ProtectedRoute>} />
            <Route path="/hcp/:id" element={<ProtectedRoute><HCPDetail /></ProtectedRoute>} />
            <Route path="/kol-mapping" element={<Navigate to="/hcp-list" replace />} />
            <Route path="/cockpit" element={<ProtectedRoute><MyCockpit /></ProtectedRoute>} />
            <Route path="/business-data" element={<ProtectedRoute><BusinessData /></ProtectedRoute>} />
            <Route path="/tag-management" element={<ProtectedRoute><TagManagement /></ProtectedRoute>} />
            <Route path="/tag-management/:id" element={<ProtectedRoute><TagDetail /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
    </SidebarStateProvider>
    </AlertConfigProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
