import { useState } from "react";
import Sidebar from "../components/common/Sidebar";
import Topbar from "../components/common/Topbar";

const DashboardLayout = ({ children }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-main)", display: "flex" }}>
      {/* Fixed Left Sidebar */}
      <Sidebar isOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          minHeight: "100vh"
        }}
        className="lg:ml-[260px]"
      >
        <Topbar onOpenMobileSidebar={() => setMobileSidebarOpen(true)} />

        <main style={{ flex: 1, padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column" }} className="dashboard-content">
          <div style={{ maxWidth: "1200px", width: "100%", margin: "0 auto", flex: 1, display: "flex", flexDirection: "column" }}>
            {children}
          </div>
        </main>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .lg\\:ml-\\[260px\\] { margin-left: 260px !important; }
        }
        @media (min-width: 1440px) {
          .dashboard-content { padding: 1.5rem 2rem !important; }
        }
      `}</style>
    </div>
  );
};

export default DashboardLayout;

