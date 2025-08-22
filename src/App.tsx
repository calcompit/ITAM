import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { Login } from "./pages/Login";
import { StatusProvider } from "@/contexts/StatusContext";


const queryClient = new QueryClient();

const App = () => {
  const [user, setUser] = useState<{ username: string } | null>(null);

  const handleLogin = (userData: { username: string }) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('it-asset-monitor-user');
    setUser(null);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <StatusProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={
                user ? <Index onLogout={handleLogout} user={user} /> : <Login onLogin={handleLogin} />
              } />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </StatusProvider>
    </QueryClientProvider>
  );
};

export default App;
