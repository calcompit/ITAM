import { useState } from "react";
import { SidebarNav } from "@/components/sidebar-nav";
import { Dashboard } from "@/pages/Dashboard";
import { Analytics } from "@/pages/Analytics";
import { Alerts } from "@/pages/Alerts";

interface IndexProps {
  onLogout: () => void;
  user: { username: string };
}

const Index = ({ onLogout, user }: IndexProps) => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);

  const handlePinnedToggle = () => {
    setShowPinnedOnly(!showPinnedOnly);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard activeTab={activeTab} showPinnedOnly={showPinnedOnly} />;
      case "analytics":
        return <Analytics showPinnedOnly={showPinnedOnly} />;
      case "alerts":
        return <Alerts />;
      default:
        return <Dashboard activeTab={activeTab} showPinnedOnly={showPinnedOnly} />;
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
        pinnedCount={0} // This will be updated by Dashboard
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
