import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import PublicHome from "./pages/public/PublicHome";
import PublicTours from "./pages/public/PublicTours";
import PublicTourDetail from "./pages/public/PublicTourDetail";
import PublicCharter from "./pages/public/PublicCharter";
import PublicContact from "./pages/public/PublicContact";
import { CheckoutSuccess, CheckoutCancel } from "./pages/public/CheckoutResult";
import AdminTourTypes from "./pages/admin/TourTypes";
import AdminPublicTours from "./pages/admin/PublicTours";
import AdminPublicEvents from "./pages/admin/PublicEvents";
import MyAbsences from "./pages/captain/MyAbsences";
import Boats from "./pages/Boats";
import Captains from "./pages/Captains";
import Users from "./pages/Users";
import Reports from "./pages/Reports";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public webshop */}
            <Route path="/" element={<PublicHome />} />
            <Route path="/touren" element={<PublicTours />} />
            <Route path="/touren/:slug" element={<PublicTourDetail />} />
            <Route path="/charter" element={<PublicCharter />} />
            <Route path="/kontakt" element={<PublicContact />} />
            <Route path="/checkout/erfolg" element={<CheckoutSuccess />} />
            <Route path="/checkout/abbruch" element={<CheckoutCancel />} />

            <Route path="/login" element={<Login />} />
            {/* Internal admin / staff / captain area */}
            <Route path="/admin" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/admin/boats" element={<ProtectedRoute><Boats /></ProtectedRoute>} />
            <Route path="/admin/captains" element={<ProtectedRoute><Captains /></ProtectedRoute>} />
            <Route path="/admin/tour-types" element={<ProtectedRoute><AdminTourTypes /></ProtectedRoute>} />
            <Route path="/admin/public-tours" element={<ProtectedRoute><AdminPublicTours /></ProtectedRoute>} />
            <Route path="/admin/public-events" element={<ProtectedRoute><AdminPublicEvents /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute requireAdmin><Users /></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute requireAdmin><Reports /></ProtectedRoute>} />
            <Route path="/captain/abwesenheiten" element={<ProtectedRoute><MyAbsences /></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
