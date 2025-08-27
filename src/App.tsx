import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { LoginModal } from "@/components/login-modal";
import { StatusProvider } from "@/contexts/StatusContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { DataProvider } from "@/contexts/DataContext";
import { websocketService } from "@/services/websocket";


const queryClient = new QueryClient();

const App = () => {
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Initialize WebSocket service for realtime updates
  useEffect(() => {
    console.log('[App] Initializing WebSocket service...');
    websocketService.connect();
    
    // Cleanup on unmount
    return () => {
      console.log('[App] Disconnecting WebSocket service...');
      websocketService.disconnect();
    };
  }, []);

  // Check for saved user on app start
  useEffect(() => {
    const savedUser = localStorage.getItem('it-asset-monitor-user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      } catch (err) {
        localStorage.removeItem('it-asset-monitor-user');
        setShowLoginModal(true);
      }
    } else {
      setShowLoginModal(true);
    }
  }, []);

  const handleLogin = (userData: { username: string }) => {
    setUser(userData);
    setShowLoginModal(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('it-asset-monitor-user');
    setUser(null);
    setShowLoginModal(true);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <StatusProvider>
          <DataProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={
                    <Index onLogout={handleLogout} user={user} />
                  } />

                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
              
              {/* Login Modal - Always render but conditionally show */}
              <LoginModal 
                isOpen={showLoginModal && !user} 
                onLogin={handleLogin}
              />
            </TooltipProvider>
          </DataProvider>
        </StatusProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
