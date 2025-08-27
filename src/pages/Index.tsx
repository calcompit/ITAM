import { useState } from "react";
import { SidebarNav } from "@/components/sidebar-nav";
import { Dashboard } from "@/pages/Dashboard";
import { Analytics } from "@/pages/Analytics";
import { Alerts } from "@/pages/Alerts";

interface IndexProps {
  onLogout: () => void;
  user: { username: string } | null;
}

const Index = ({ onLogout, user }: IndexProps) => {
  // If no user, show loading or empty state
  if (!user) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">กำลังโหลด...</p>
        </div>
      </div>
    );
  }
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [pinnedCount, setPinnedCount] = useState(0);

  const handlePinnedToggle = () => {
    setShowPinnedOnly(!showPinnedOnly);
  };

  const handlePinnedCountChange = (count: number) => {
    setPinnedCount(count);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard activeTab={activeTab} showPinnedOnly={showPinnedOnly} onPinnedCountChange={handlePinnedCountChange} />;
      case "analytics":
        return <Analytics showPinnedOnly={showPinnedOnly} />;
      case "alerts":
        return <Alerts />;
      default:
        return <Dashboard activeTab={activeTab} showPinnedOnly={showPinnedOnly} onPinnedCountChange={handlePinnedCountChange} />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <SidebarNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={onLogout}
        user={user}
        showPinnedOnly={showPinnedOnly}
        onPinnedToggle={handlePinnedToggle}
        pinnedCount={pinnedCount}
      />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default Index;
