import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { getSession } from "@/lib/auth";
import ScrollToTop from "@/components/ScrollToTop";
import SupportChatWidget from "@/components/SupportChatWidget";
import Icon from "@/components/ui/icon";
import Index from "./pages/Index";

// Остальные страницы подгружаются отдельными чанками по мере перехода —
// это уменьшает вес главного бандла и ускоряет первую загрузку сайта.
const Admin = lazy(() => import("./pages/Admin"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Builder = lazy(() => import("./pages/Builder"));
const Blog = lazy(() => import("./pages/Blog"));
const Article = lazy(() => import("./pages/Article"));
const GithubCallback = lazy(() => import("./pages/GithubCallback"));
const YandexCallback = lazy(() => import("./pages/YandexCallback"));
const TelegramCallback = lazy(() => import("./pages/TelegramCallback"));
const DomainSettings = lazy(() => import("./pages/DomainSettings"));
const Pricing = lazy(() => import("./pages/Pricing"));
const OrderStatus = lazy(() => import("./pages/OrderStatus"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Leads = lazy(() => import("./pages/Leads"));
const Files = lazy(() => import("./pages/Files"));
const PublicSite = lazy(() => import("./pages/PublicSite"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Icon name="Loader" size={28} className="animate-spin text-primary" />
    </div>
  );
}

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
        <Suspense fallback={<PageLoader />}>
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
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;