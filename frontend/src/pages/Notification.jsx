import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  CheckCircle2,
  PiggyBank,
  RefreshCw,
  Target,
  Wallet,
} from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const getNotificationErrorMessage = (error, fallback) => {
  if (!localStorage.getItem("token")) {
    return "Please sign in to load notifications and alerts.";
  }

  if (!error.response) {
    return "Notification server is not reachable. Start the backend on port 4000 and try again.";
  }

  if (error.response.status === 401) {
    return "Your session has expired. Please sign in again.";
  }

  return error.response?.data?.message || fallback;
};

const Notification = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const authHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchNotifications = async () => {
    if (!localStorage.getItem("token")) {
      setItems([]);
      setMessage("Please sign in to load notifications and alerts.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await axios.get(`${BASE_URL}/notification/get`, {
        headers: authHeaders(),
      });
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setMessage(
        getNotificationErrorMessage(error, "Unable to load notifications.")
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = useMemo(() => {
    const high = items.filter((item) => item.priority === "High").length;
    const medium = items.filter((item) => item.priority === "Medium").length;
    const discipline = items.filter((item) =>
      ["Budget Exceeded", "Budget Warning", "Low Balance"].includes(item.type)
    ).length;

    return { high, medium, discipline };
  }, [items]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Notifications & Alerts
          </h1>
          <p className="text-sm text-gray-600">
            Improve financial discipline with budget, balance, goal, EMI, and recurring alerts.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchNotifications}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          icon={<AlertTriangle size={20} />}
          label="High Priority"
          value={summary.high}
        />
        <SummaryCard
          icon={<Bell size={20} />}
          label="Medium Priority"
          value={summary.medium}
        />
        <SummaryCard
          icon={<PiggyBank size={20} />}
          label="Discipline Alerts"
          value={summary.discipline}
        />
      </div>

      <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-gray-900">Alert Center</h2>
          <p className="text-sm text-gray-500">
            Example: Food Budget Reached 90%
          </p>
        </div>

        {message && (
          <p className="mb-4 rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-800">
            {message}
          </p>
        )}

        <div className="space-y-3">
          {loading && (
            <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
              Loading alerts...
            </p>
          )}

          {!loading && items.length === 0 && (
            <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
              No alerts right now.
            </p>
          )}

          {!loading &&
            items.map((item) => (
              <article
                key={item.id}
                className="grid gap-3 rounded-lg border border-gray-100 p-4 hover:border-indigo-200 sm:grid-cols-[auto_1fr_auto]"
              >
                <span className={`rounded-lg p-3 ${iconClasses(item.priority)}`}>
                  {alertIcon(item.type)}
                </span>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{item.title}</h3>
                    <PriorityBadge priority={item.priority} />
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{item.message}</p>
                  <p className="mt-2 text-xs font-medium text-gray-500">
                    {item.type}
                  </p>
                </div>

                <span className="self-start rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                  Alert
                </span>
              </article>
            ))}
        </div>
      </div>
    </section>
  );
};

const alertIcon = (type) => {
  if (type === "Low Balance") return <Wallet size={20} />;
  if (type === "Goal Achieved") return <Target size={20} />;
  if (type === "Upcoming EMI" || type === "Recurring Expense") {
    return <CalendarClock size={20} />;
  }
  if (type === "Budget Warning" || type === "Budget Exceeded") {
    return <AlertTriangle size={20} />;
  }
  return <CheckCircle2 size={20} />;
};

const iconClasses = (priority) => {
  if (priority === "High") return "bg-red-50 text-red-700";
  if (priority === "Medium") return "bg-amber-50 text-amber-700";
  return "bg-emerald-50 text-emerald-700";
};

const PriorityBadge = ({ priority }) => {
  const classes =
    priority === "High"
      ? "bg-red-50 text-red-700"
      : priority === "Medium"
        ? "bg-amber-50 text-amber-700"
        : "bg-emerald-50 text-emerald-700";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${classes}`}>
      {priority}
    </span>
  );
};

const SummaryCard = ({ icon, label, value }) => (
  <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
    <div className="mb-4 inline-flex rounded-lg bg-indigo-50 p-2 text-indigo-700">
      {icon}
    </div>
    <p className="text-sm font-medium text-gray-500">{label}</p>
    <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
  </div>
);

export default Notification;
