import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { styles } from "../assets/dummyStyles.js";
import Navbar from "../components/Navbar.jsx";
// import { Sidebar } from "lucide-react";
import Sidebar from "../components/Sidebar.jsx";

const Layout = ({ onLogout, user }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className={styles.layout.root}>
      <Navbar user={user} onLogout={onLogout} />
      <Sidebar
        user={user}
        isCollapsed={sidebarCollapsed}
        setIsCollapsed={setSidebarCollapsed}
      />
      <main className={styles.layout.mainContainer(sidebarCollapsed)}>
        <div className="page-enter mx-auto w-full max-w-[1500px]">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
