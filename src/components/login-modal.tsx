import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { X } from "lucide-react";
import { apiService } from "@/services/api";

interface LoginModalProps {
  isOpen: boolean;
  onLogin: (user: { username: string }) => void;
  onClose?: () => void;
}

export function LoginModal({ isOpen, onLogin, onClose }: LoginModalProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Check for saved login on component mount
  useEffect(() => {
    if (isOpen) {
      const savedUser = localStorage.getItem('it-asset-monitor-user');
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          onLogin(userData);
        } catch (err) {
          localStorage.removeItem('it-asset-monitor-user');
        }
      }
    }
  }, [isOpen, onLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError("กรุณากรอกชื่อผู้ใช้และรหัสผ่าน");
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      const result = await apiService.login(username, password);
      
      if (result.success && result.user) {
        // Save user data to localStorage
        localStorage.setItem('it-asset-monitor-user', JSON.stringify(result.user));
        onLogin(result.user);
        // Clear form
        setUsername("");
        setPassword("");
        setError("");
      } else {
        setError(result.message || "เข้าสู่ระบบไม่สำเร็จ");
      }
    } catch (err) {
      console.error('Login error:', err);
      setError("เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md relative animate-in fade-in-0 zoom-in-95 duration-200 bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-3 right-3 h-8 w-8 p-0 hover:bg-gray-100 transition-colors"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        
        <CardHeader className="text-center space-y-4 pt-8">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white text-2xl font-bold">IT</span>
            </div>
          </div>
          
          <div>
            <CardTitle className="text-2xl font-semibold text-gray-900">
              IT Asset Monitor
            </CardTitle>
            <p className="text-gray-600 text-sm mt-1">เข้าสู่ระบบเพื่อจัดการทรัพยากร IT</p>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert variant="destructive" className="animate-in slide-in-from-top-2 duration-200">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                  ชื่อผู้ใช้
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="กรอกชื่อผู้ใช้"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-11 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  disabled={loading}
                  autoFocus
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  รหัสผ่าน
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="กรอกรหัสผ่าน"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  disabled={loading}
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>กำลังเข้าสู่ระบบ...</span>
                </div>
              ) : (
                "เข้าสู่ระบบ"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
