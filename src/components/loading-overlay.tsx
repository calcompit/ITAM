import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  subMessage?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  isLoading, 
  message = "กำลังโหลดข้อมูล...", 
  subMessage 
}) => {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Blur background */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      
      {/* Loading modal */}
      <div className="relative bg-card border rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Spinner */}
          <div className="relative">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          
          {/* Main message */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              {message}
            </h3>
            
            {/* Sub message */}
            {subMessage && (
              <p className="text-sm text-muted-foreground">
                {subMessage}
              </p>
            )}
          </div>
          
          {/* Progress dots */}
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Specific loading overlays for different scenarios
export const DashboardLoadingOverlay: React.FC<{ isLoading: boolean }> = ({ isLoading }) => (
  <LoadingOverlay 
    isLoading={isLoading}
    message="กำลังโหลดข้อมูล Dashboard"
    subMessage="ดึงข้อมูลคอมพิวเตอร์และเครือข่าย..."
  />
);

export const AnalyticsLoadingOverlay: React.FC<{ isLoading: boolean }> = ({ isLoading }) => (
  <LoadingOverlay 
    isLoading={isLoading}
    message="กำลังโหลดข้อมูล Analytics"
    subMessage="วิเคราะห์ข้อมูลสถิติและรายงาน..."
  />
);

export const ComputerDetailsLoadingOverlay: React.FC<{ isLoading: boolean }> = ({ isLoading }) => (
  <LoadingOverlay 
    isLoading={isLoading}
    message="กำลังโหลดรายละเอียดคอมพิวเตอร์"
    subMessage="ดึงข้อมูลการเปลี่ยนแปลงและประวัติ..."
  />
);
