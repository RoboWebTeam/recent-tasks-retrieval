import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { getSession } from "@/lib/auth";
import ScrollToTop from "@/components/ScrollToTop";
import SupportChatWidget from "@/components/SupportChatWidget";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Builder from "./pages/Builder";
import Blog from "./pages/Blog";
import Article from "./pages/Article";
import GithubCallback from "./pages/GithubCallback";
import YandexCallback from "./pages/YandexCallback";
import TelegramCallback from "./pages/TelegramCallback";
import DomainSettings from "./pages/DomainSettings";
import Pricing from "./pages/Pricing";
import OrderStatus from "./pages/OrderStatus";
import Analytics from "./pages/Analytics";
import Leads from "./pages/Leads";
import Files from "./pages/Files";
import PublicSite from "./pages/PublicSite";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Защищённый роут — редиректит на /login если нет сессии
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return getSession() ? <>{children}</> : <Navigate to="/login" replace />;
}

// Виджет чата виден везде, кроме админ-панели (там своя вкладка чата)
function GlobalSupportChat() {
  const location = useLocation();
  if (location.pathname.startsWith('/admin')) return null;
  return <SupportChatWidget />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <GlobalSupportChat />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<Article />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/pricing/status" element={<OrderStatus />} />
          <Route path="/site/:slug" element={<PublicSite />} />
          <Route path="/auth/github/callback" element={<GithubCallback />} />
          <Route path="/auth/yandex/callback" element={<YandexCallback />} />
          <Route path="/auth/telegram/callback" element={<TelegramCallback />} />

          {/* Защищённые роуты */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/builder" element={<ProtectedRoute><Builder /></ProtectedRoute>} />
          <Route path="/settings/domain" element={<ProtectedRoute><DomainSettings /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
          <Route path="/files" element={<ProtectedRoute><Files /></ProtectedRoute>} />
          <Route path="/admin" element={<Admin />} />
          {/* /admin защищён собственным паролем внутри компонента */}

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;