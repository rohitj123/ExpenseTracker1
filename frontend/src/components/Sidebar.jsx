import React, { useEffect, useState, useRef } from "react";
import { sidebarStyles, cn } from "../assets/dummyStyles";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowDown, ArrowRightLeft, ArrowUp, BarChart3, Bell, CreditCard, Download, Landmark, Home, User, LogOut, Menu, PiggyBank, Receipt, Repeat2, Target, Users, WalletCards } from "lucide-react";

const MENU_ITEMS = [
  { text: "Dashboard", path: "/", icon: <Home size={20} /> },
  { text: "Income", path: "/income", icon: <ArrowUp size={20} /> },
  { text: "Expenses", path: "/expense", icon: <ArrowDown size={20} /> },
  { text: "Budgets", path: "/budget", icon: <PiggyBank size={20} /> },
  { text: "Savings Goals", path: "/savings-goal", icon: <Target size={20} /> },
  { text: "Transactions", path: "/transactions", icon: <ArrowRightLeft size={20} /> },
  { text: "Accounts", path: "/accounts", icon: <Landmark size={20} /> },
  { text: "Recurring", path: "/recurring-transactions", icon: <Repeat2 size={20} /> },
  { text: "Split Bills", path: "/split-expenses", icon: <Users size={20} /> },
  { text: "Receipts", path: "/receipts", icon: <Receipt size={20} /> },
  { text: "Alerts", path: "/notifications", icon: <Bell size={20} /> },
  { text: "Reports", path: "/reports", icon: <BarChart3 size={20} /> },
  { text: "Exports", path: "/exports", icon: <Download size={20} /> },
  { text: "Family", path: "/family-finance", icon: <WalletCards size={20} /> },
  { text: "Subscriptions", path: "/subscriptions", icon: <CreditCard size={20} /> },
  { text: "AI Advisor", path: "/ai-advisor", icon: <BarChart3 size={20} /> },
  { text: "Profile", path: "/profile", icon: <User size={20} /> },
];

const Sidebar = ({ user, isCollapsed, setIsCollapsed }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const sidebarRef = useRef(null);

  const [mobileOpen, setMobileOpen] = useState(false);

  const { name: username = "User" } = user || {};
  const initial = username.charAt(0).toUpperCase();

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "auto";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [mobileOpen]);

useEffect(() => {
  const handleClickOutside = (e) => {
    if (
      sidebarRef.current &&
      !sidebarRef.current.contains(e.target)
    ) {
      setIsCollapsed(true); // close sidebar
      setMobileOpen(false); // close mobile sidebar if open
    }
  };

  document.addEventListener("click", handleClickOutside);

  return () => {
    document.removeEventListener(
      "click",
      handleClickOutside
    );
  };
}, [setIsCollapsed]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const toggleSidebar = () =>
    setIsCollapsed((prev) => !prev);

  const handleSidebarToggle = (event) => {
    event.stopPropagation();

    if (window.innerWidth < 1024) {
      setMobileOpen((prev) => !prev);
      return;
    }

    toggleSidebar();
  };

  const renderMenuItem = ({ text, path, icon }) => {
    const isActive = pathname === path;
    const showText = !isCollapsed || mobileOpen;

    return (
      <li key={text}>
        <Link
          to={path}
          onClick={() => setMobileOpen(false)}
          className={cn(
            sidebarStyles.menuItem.base,
            isActive
              ? sidebarStyles.menuItem.active
              : sidebarStyles.menuItem.inactive,
            !showText
              ? sidebarStyles.menuItem.collapsed
              : sidebarStyles.menuItem.expanded
          )}
        >
          {icon}

          {showText && (
            <span>{text}</span>
          )}
        </Link>
      </li>
    );
  };

  const showExpandedContent = !isCollapsed || mobileOpen;

  return (
    <>
      <button
        type="button"
        onClick={handleSidebarToggle}
        className="fixed left-4 top-20 z-[60] inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-indigo-700 shadow-lg ring-1 ring-gray-200 lg:hidden"
        aria-label="Open sidebar"
      >
        <Menu size={20} />
      </button>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
        />
      )}

      <div
        ref={sidebarRef}
        className={cn(
          sidebarStyles.sidebarContainer.base,
          "fixed left-0 top-0 z-50 h-screen bg-white shadow-md transition-transform duration-300 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        style={{
          width: mobileOpen ? 256 : isCollapsed ? 80 : 256,
          transition: "width 0.3s, transform 0.3s",
        }}
      >
      <div className={sidebarStyles.sidebarInner.base}>
        
        {/* Toggle button */}
        <button
          onClick={handleSidebarToggle}
          className={sidebarStyles.toggleButton.base}
          aria-label="Toggle sidebar"
        >
          <Menu size={16} />
        </button>

        {/* User profile */}
        <div className="flex items-center gap-3 border-b border-gray-100 p-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-emerald-400 text-white font-bold flex items-center justify-center shadow-sm">
            {initial}
          </div>

          {showExpandedContent && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">
                {username}
              </p>
              <p className="text-xs text-gray-500">Finance workspace</p>
            </div>
          )}
        </div>

        {/* Menu items */}
        <ul className="mt-4 flex-1 space-y-1 overflow-y-auto px-2 pb-4">
          {MENU_ITEMS.map(renderMenuItem)}
        </ul>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="m-3 flex gap-2 rounded-xl border border-red-100 p-3 text-red-600 hover:bg-red-50"
        >
          <LogOut size={20} />

          {showExpandedContent && (
            <span>Logout</span>
          )}
        </button>

      </div>
      </div>
    </>
  );
};

export default Sidebar;
