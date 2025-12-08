import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import CalendarPage from "./pages/CalendarPage";
import PatientsPage from "./pages/PatientsPage";
import TherapistsPage from "./pages/TherapistsPage";
import TherapyTypesPage from "./pages/TherapyTypesPage";
import RoomsPage from "./pages/RoomsPage";
import SeedPage from "./pages/SeedPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/seed" element={<SeedPage />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/calendar" element={
              <ProtectedRoute>
                <CalendarPage />
              </ProtectedRoute>
            } />
            <Route path="/patients" element={
              <ProtectedRoute>
                <PatientsPage />
              </ProtectedRoute>
            } />
            <Route path="/therapists" element={
              <ProtectedRoute allowedRoles={['system_admin', 'clinic_admin', 'receptionist']}>
                <TherapistsPage />
              </ProtectedRoute>
            } />
            <Route path="/therapy-types" element={
              <ProtectedRoute allowedRoles={['system_admin', 'clinic_admin']}>
                <TherapyTypesPage />
              </ProtectedRoute>
            } />
            <Route path="/rooms" element={
              <ProtectedRoute allowedRoles={['system_admin', 'clinic_admin']}>
                <RoomsPage />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
