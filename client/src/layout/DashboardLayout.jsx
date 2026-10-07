import { useState } from "react";
import Sidebar from "../components/common/Sidebar";
import Topbar from "../components/common/Topbar";

const DashboardLayout = ({ children }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "linear-gradient(180deg, rgba(22, 163, 74, 0.05), transparent 30%), var(--bg-main)"
      }}
      className="dashboard-shell"
    >
      <Sidebar isOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          minHeight: "100vh"
        }}
        className="dashboard-main-column lg:ml-[260px]"
      >
        <Topbar onOpenMobileSidebar={() => setMobileSidebarOpen(true)} />

        <main
          style={{
            flex: 1,
            padding: "1.5rem 1.5rem 2rem",
            display: "flex",
            flexDirection: "column",
            background: "radial-gradient(circle at top left, rgba(22, 163, 74, 0.08), transparent 25%)"
          }}
          className="dashboard-content"
        >
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
          .dashboard-content { padding: 1.75rem 2rem 2.25rem !important; }
        }
      `}</style>
    </div>
  );
};

export default DashboardLayout;
