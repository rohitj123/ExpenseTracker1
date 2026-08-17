import React, { useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard.jsx";
import Income from "./pages/Income.jsx";
import Expense from "./pages/Expense.jsx";
import Budget from "./pages/Budget.jsx";
import SavingsGoal from "./pages/SavingsGoal.jsx";
import Transaction from "./pages/Transaction.jsx";
import Account from "./pages/Account.jsx";
import RecurringTransaction from "./pages/RecurringTransaction.jsx";
import SplitExpense from "./pages/SplitExpense.jsx";
import ReceiptManagement from "./pages/ReceiptManagement.jsx";
import Notification from "./pages/Notification.jsx";
import ReportAnalytics from "./pages/ReportAnalytics.jsx";
import ExportDownload from "./pages/ExportDownload.jsx";
import FamilyFinance from "./pages/FamilyFinance.jsx";
import SubscriptionManagement from "./pages/SubscriptionManagement.jsx";
import AIFinancialAdvisor from "./pages/AIFinancialAdvisor.jsx";
import Profile from "./pages/Profile.jsx";
import Auth from "./pages/Auth.jsx";
import Layout from "./components/Layout.jsx";

const App = () => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  const navigate = useNavigate();

  const clearAuth = () => {
    try {
      localStorage.removeItem("user");
      localStorage.removeItem("token");

      sessionStorage.removeItem("user");
      sessionStorage.removeItem("token");
    } catch (error) {
      console.error("clearAuth error:", error);
    }

    setUser(null);
    setToken(null);
  };

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  return (
    <Routes>
      <Route
        path="/login"
        element={<Auth mode="login" setToken={setToken} setUser={setUser} />}
      />
      <Route
        path="/register"
        element={<Auth mode="register" setToken={setToken} setUser={setUser} />}
      />
      <Route
        element={
          token ? (
            <Layout user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/income" element={<Income />} />
        <Route path="/expense" element={<Expense />} />
        <Route path="/budget" element={<Budget />} />
        <Route path="/savings-goal" element={<SavingsGoal />} />
        <Route path="/transactions" element={<Transaction />} />
        <Route path="/accounts" element={<Account />} />
        <Route path="/recurring-transactions" element={<RecurringTransaction />} />
        <Route path="/split-expenses" element={<SplitExpense />} />
        <Route path="/receipts" element={<ReceiptManagement />} />
        <Route path="/notifications" element={<Notification />} />
        <Route path="/reports" element={<ReportAnalytics />} />
        <Route path="/exports" element={<ExportDownload />} />
        <Route path="/family-finance" element={<FamilyFinance />} />
        <Route path="/subscriptions" element={<SubscriptionManagement />} />
        <Route path="/ai-advisor" element={<AIFinancialAdvisor />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
    </Routes>
  );
};

export default App;
