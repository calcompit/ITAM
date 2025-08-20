import { useState } from "react";
import { SidebarNav } from "@/components/sidebar-nav";
import { Dashboard } from "@/pages/Dashboard";

interface IndexProps {
  onLogout: () => void;
  user: { username: string };
}

const Index = ({ onLogout, user }: IndexProps) => {
  const [activeTab, setActiveTab] = useState("dashboard");



  return (
    <div className="flex h-screen bg-background">
      <SidebarNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={onLogout}
        user={user}
      />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <Dashboard activeTab={activeTab} />
        </div>
      </main>
    </div>
  );
};

export default Index;
