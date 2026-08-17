import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  CalendarDays,
  IndianRupee,
  PieChart,
  TrendingUp,
} from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const RANGES = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
];

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const getReportErrorMessage = (error, fallback) => {
  if (!localStorage.getItem("token")) {
    return "Please sign in to load reports and analytics.";
  }

  if (!error.response) {
    return "Reports server is not reachable. Start the backend on port 4000 and try again.";
  }

  if (error.response.status === 401) {
    return "Your session has expired. Please sign in again.";
  }

  return error.response?.data?.message || fallback;
};

const ReportAnalytics = () => {
  const [range, setRange] = useState("monthly");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const authHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchReports = async () => {
    if (!localStorage.getItem("token")) {
      setReport(null);
      setMessage("Please sign in to load reports and analytics.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await axios.get(`${BASE_URL}/report/get`, {
        headers: authHeaders(),
        params: { range },
      });
      setReport(response.data?.data || null);
    } catch (error) {
      setMessage(getReportErrorMessage(error, "Unable to load reports."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  const analytics = report?.analytics || {};
  const expenseReport = report?.expenseReport || {};

  const maxCategoryAmount = useMemo(() => {
    return Math.max(
      ...(analytics.topCategories || []).map((item) => Number(item.amount || 0)),
      1
    );
  }, [analytics.topCategories]);

  const maxTrendAmount = useMemo(() => {
    return Math.max(
      ...(analytics.monthlyTrends || []).flatMap((item) => [
        Number(item.income || 0),
        Number(item.expense || 0),
      ]),
      1
    );
  }, [analytics.monthlyTrends]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Reports & Analytics
          </h1>
          <p className="text-sm text-gray-600">
            View spending insights across daily, weekly, monthly, and yearly reports.
          </p>
        </div>

        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
          {RANGES.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setRange(item.value)}
              className={`rounded-md px-3 py-2 text-sm font-semibold ${
                range === item.value
                  ? "bg-indigo-600 text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {message && (
        <p className="rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-800">
          {message}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard
          icon={<IndianRupee size={20} />}
          label={`${selectedRangeLabel(range)} Expense`}
          value={currency.format(Number(expenseReport.totalExpense || 0))}
        />
        <SummaryCard
          icon={<ArrowUp size={20} />}
          label="Income"
          value={currency.format(Number(analytics.totalIncome || 0))}
        />
        <SummaryCard
          icon={<ArrowDown size={20} />}
          label="Expense"
          value={currency.format(Number(analytics.totalExpense || 0))}
        />
        <SummaryCard
          icon={<TrendingUp size={20} />}
          label="Savings Rate"
          value={`${analytics.savingsRate || 0}%`}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <PieChart className="text-indigo-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">
              Top Categories
            </h2>
          </div>

          <div className="space-y-4">
            {loading && (
              <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
                Loading category analytics...
              </p>
            )}

            {!loading && (analytics.topCategories || []).length === 0 && (
              <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
                No category spending yet.
              </p>
            )}

            {(analytics.topCategories || []).map((item) => (
              <div key={item.category}>
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-gray-900">
                    {item.category}
                  </span>
                  <span className="text-gray-600">
                    {currency.format(Number(item.amount || 0))}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-indigo-500"
                    style={{
                      width: `${Math.max((Number(item.amount || 0) / maxCategoryAmount) * 100, 6)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <BarChart3 className="text-indigo-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">
              Monthly Trends
            </h2>
          </div>

          <div className="space-y-4">
            {loading && (
              <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
                Loading monthly trends...
              </p>
            )}

            {!loading && (analytics.monthlyTrends || []).length === 0 && (
              <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
                No monthly trend data yet.
              </p>
            )}

            {(analytics.monthlyTrends || []).map((item) => (
              <div key={item.month} className="rounded-lg bg-gray-50 p-3">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <CalendarDays size={16} />
                  {item.month}
                </div>
                <TrendBar
                  label="Income"
                  amount={item.income}
                  max={maxTrendAmount}
                  color="bg-emerald-500"
                />
                <TrendBar
                  label="Expense"
                  amount={item.expense}
                  max={maxTrendAmount}
                  color="bg-rose-500"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Income vs Expense
          </h2>
          <p className="text-sm text-gray-500">
            Savings is income minus expense for the selected report period.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Metric label="Total Income" value={analytics.totalIncome} tone="green" />
          <Metric label="Total Expense" value={analytics.totalExpense} tone="red" />
          <Metric label="Savings" value={analytics.totalSavings} tone="indigo" />
        </div>
      </div>
    </section>
  );
};

const selectedRangeLabel = (range) =>
  RANGES.find((item) => item.value === range)?.label || "Monthly";

const TrendBar = ({ label, amount, max, color }) => (
  <div className="mb-2">
    <div className="mb-1 flex items-center justify-between text-xs text-gray-600">
      <span>{label}</span>
      <span>{currency.format(Number(amount || 0))}</span>
    </div>
    <div className="h-2 overflow-hidden rounded-full bg-white">
      <div
        className={`h-full rounded-full ${color}`}
        style={{ width: `${Math.max((Number(amount || 0) / max) * 100, 4)}%` }}
      />
    </div>
  </div>
);

const Metric = ({ label, value, tone }) => {
  const classes = {
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-rose-50 text-rose-700",
    indigo: "bg-indigo-50 text-indigo-700",
  };

  return (
    <div className={`rounded-lg p-4 ${classes[tone]}`}>
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-1 text-2xl font-bold">
        {currency.format(Number(value || 0))}
      </p>
    </div>
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

export default ReportAnalytics;
