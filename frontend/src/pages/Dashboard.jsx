import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  CheckCircle2,
  PieChart,
  PiggyBank,
  Target,
  WalletCards,
} from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const pieColors = ["#4f46e5", "#10b981", "#f43f5e", "#f59e0b", "#06b6d4", "#8b5cf6"];

const getDashboardErrorMessage = (error, fallback) => {
  if (!localStorage.getItem("token")) {
    return "Please sign in to load the financial dashboard.";
  }

  if (!error.response) {
    return "Dashboard server is not reachable. Start the backend on port 4000 and try again.";
  }

  if (error.response.status === 401) {
    return "Your session has expired. Please sign in again.";
  }

  return error.response?.data?.message || fallback;
};

const Dashboard = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const authHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchOverview = async () => {
    if (!localStorage.getItem("token")) {
      setOverview(null);
      setMessage("Please sign in to load the financial dashboard.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await axios.get(`${BASE_URL}/dashboard/overview`, {
        headers: authHeaders(),
      });
      setOverview(response.data?.data || null);
    } catch (error) {
      setMessage(
        getDashboardErrorMessage(error, "Unable to load dashboard overview.")
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const topExpenseCategories = useMemo(() => {
    return [...(overview?.expenseDistribution || [])]
      .sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0))
      .slice(0, 4);
  }, [overview]);

  const maxCategoryAmount = useMemo(() => {
    return Math.max(
      ...topExpenseCategories.map((item) => Number(item.amount || 0)),
      1
    );
  }, [topExpenseCategories]);

  const maxTrendAmount = useMemo(() => {
    return Math.max(
      ...(overview?.monthlyTrends || []).flatMap((item) => [
        Number(item.income || 0),
        Number(item.expense || 0),
        Math.abs(Number(item.savings || 0)),
      ]),
      1
    );
  }, [overview]);

  const pieData = useMemo(() => {
    const categories = [...(overview?.expenseDistribution || [])]
      .sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0))
      .filter((item) => Number(item.amount || 0) > 0);

    const top = categories.slice(0, 5).map((item, index) => ({
      label: item.category,
      value: Number(item.amount || 0),
      color: pieColors[index],
    }));

    const otherTotal = categories
      .slice(5)
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    if (otherTotal > 0) {
      top.push({
        label: "Other",
        value: otherTotal,
        color: pieColors[5],
      });
    }

    return top;
  }, [overview]);

  const totalFlow = Math.max(
    Number(overview?.totalIncome || 0) + Number(overview?.totalExpense || 0),
    1
  );

  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-lg border border-white/70 bg-gradient-to-br from-slate-950 via-indigo-950 to-emerald-800 p-6 text-white shadow-xl sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-200">
              Financial overview
            </p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
              Beautiful money dashboard
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">
              Track income, expenses, savings, budgets, and goals with clean analytics and visual charts.
            </p>
          </div>
          <div className="rounded-lg bg-white/10 p-5 backdrop-blur">
            <p className="text-xs font-semibold uppercase text-white/60">
              Savings Rate
            </p>
            <p className="mt-2 text-4xl font-bold">{overview?.savingsRate || 0}%</p>
          </div>
        </div>
      </div>

      {message && (
        <p className="rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-800">
          {message}
        </p>
      )}

      {loading && (
        <p className="rounded-lg bg-white p-5 text-sm text-gray-500 shadow-sm">
          Loading financial overview...
        </p>
      )}

      <div className="stagger-list grid gap-4 md:grid-cols-3 xl:grid-cols-5">
        <SummaryCard
          icon={<ArrowUp size={20} />}
          label="Total Income"
          value={currency.format(Number(overview?.totalIncome || 0))}
          tone="green"
        />
        <SummaryCard
          icon={<ArrowDown size={20} />}
          label="Total Expense"
          value={currency.format(Number(overview?.totalExpense || 0))}
          tone="red"
        />
        <SummaryCard
          icon={<PiggyBank size={20} />}
          label="Current Savings"
          value={currency.format(Number(overview?.currentSavings || 0))}
          tone="indigo"
        />
        <SummaryCard
          icon={<WalletCards size={20} />}
          label="Budget Status"
          value={`${overview?.budgetSummary?.onTrack || 0} On Track`}
          tone="amber"
        />
        <SummaryCard
          icon={<Target size={20} />}
          label="Goals"
          value={`${overview?.goalsSummary?.completed || 0}/${overview?.goalsSummary?.totalGoals || 0}`}
          tone="violet"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <PieChartPanel data={pieData} total={Number(overview?.totalExpense || 0)} />
        <div className="motion-card rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <CheckCircle2 className="text-emerald-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">
              Financial Highlights
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <HighlightTile label="Income" value={currency.format(Number(overview?.totalIncome || 0))} tone="emerald" />
            <HighlightTile label="Expense" value={currency.format(Number(overview?.totalExpense || 0))} tone="rose" />
            <HighlightTile label="Savings" value={currency.format(Number(overview?.currentSavings || 0))} tone="indigo" />
            <HighlightTile label="Goals Completed" value={`${overview?.goalsSummary?.completed || 0}`} tone="amber" />
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="motion-card rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <BarChart3 className="text-indigo-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">
              Income vs Expense
            </h2>
          </div>

          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            <MiniMetric
              label="Income"
              value={currency.format(Number(overview?.totalIncome || 0))}
            />
            <MiniMetric
              label="Expenses"
              value={currency.format(Number(overview?.totalExpense || 0))}
            />
            <MiniMetric
              label="Savings"
              value={currency.format(Number(overview?.currentSavings || 0))}
            />
          </div>

          <div className="mb-6 grid grid-cols-3 items-end gap-4 border-b border-gray-100 pb-4">
            <VerticalBar
              label="Income"
              value={overview?.totalIncome || 0}
              max={totalFlow}
              color="bg-emerald-500"
            />
            <VerticalBar
              label="Expense"
              value={overview?.totalExpense || 0}
              max={totalFlow}
              color="bg-rose-500"
            />
            <VerticalBar
              label="Savings"
              value={Math.max(Number(overview?.currentSavings || 0), 0)}
              max={totalFlow}
              color="bg-indigo-500"
            />
          </div>

          <h3 className="mb-4 text-sm font-semibold text-gray-900">
            Top Categories
          </h3>
          <div className="space-y-4">
            {topExpenseCategories.length === 0 && (
              <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
                No expense categories yet.
              </p>
            )}

            {topExpenseCategories.map((item) => (
              <div key={item.category}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-semibold text-gray-900">
                    {item.category}
                  </span>
                  <span className="text-gray-600">
                    {currency.format(Number(item.amount || 0))}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="animate-width h-full rounded-full bg-indigo-500"
                    style={{
                      width: `${Math.max((Number(item.amount || 0) / maxCategoryAmount) * 100, 6)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="motion-card rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <BarChart3 className="text-indigo-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">
              Monthly Trends
            </h2>
          </div>

          <div className="space-y-4">
            {(overview?.monthlyTrends || []).length === 0 && (
              <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
                No trend data yet.
              </p>
            )}

            {(overview?.monthlyTrends || []).map((trend) => (
              <div key={trend.month} className="rounded-lg bg-gray-50 p-3">
                <p className="mb-3 text-sm font-semibold text-gray-900">
                  {trend.month}
                </p>
                <TrendLine
                  label="Income"
                  value={trend.income}
                  max={maxTrendAmount}
                  color="bg-emerald-500"
                />
                <TrendLine
                  label="Expense"
                  value={trend.expense}
                  max={maxTrendAmount}
                  color="bg-rose-500"
                />
                <TrendLine
                  label="Savings"
                  value={Math.max(Number(trend.savings || 0), 0)}
                  max={maxTrendAmount}
                  color="bg-indigo-500"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="motion-card rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <WalletCards className="text-indigo-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">
              Budget Analysis
            </h2>
          </div>

          <div className="space-y-3">
            {(overview?.budgetStatus || []).length === 0 && (
              <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
                No budgets set yet.
              </p>
            )}

            {(overview?.budgetStatus || []).slice(0, 5).map((budget) => (
              <article key={budget._id} className="rounded-lg bg-gray-50 p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {budget.category}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {currency.format(Number(budget.spent || 0))} of{" "}
                      {currency.format(Number(budget.amount || 0))}
                    </p>
                  </div>
                  <StatusBadge status={budget.status} />
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white">
                  <div
                    className={`animate-width h-full rounded-full ${budgetColor(budget.status)}`}
                    style={{ width: `${Math.min(budget.percentUsed || 0, 100)}%` }}
                  />
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="motion-card rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <Target className="text-indigo-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">
              Goals Analysis
            </h2>
          </div>

          <div className="space-y-3">
            {(overview?.goalStatus || []).length === 0 && (
              <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
                No goals added yet.
              </p>
            )}

            {(overview?.goalStatus || []).slice(0, 5).map((goal) => (
              <article key={goal._id} className="rounded-lg bg-gray-50 p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {goal.goalName}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {currency.format(Number(goal.currentAmount || 0))} saved of{" "}
                      {currency.format(Number(goal.targetAmount || 0))}
                    </p>
                  </div>
                  <StatusBadge status={goal.status} />
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white">
                  <div
                    className="animate-width h-full rounded-full bg-emerald-500"
                    style={{ width: `${goal.progress || 0}%` }}
                  />
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="motion-card rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <CheckCircle2 className="text-indigo-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">
              Dashboard Widgets
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <WidgetLine label="Total Income" value="Active" />
            <WidgetLine label="Total Expense" value="Active" />
            <WidgetLine label="Current Savings" value="Active" />
            <WidgetLine label="Budget Status" value="Active" />
            <WidgetLine label="Goals" value="Active" />
            <WidgetLine
              label="Savings Rate"
              value={`${overview?.savingsRate || 0}%`}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

const SummaryCard = ({ icon, label, value, tone }) => {
  const tones = {
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-rose-50 text-rose-700",
    indigo: "bg-indigo-50 text-indigo-700",
    amber: "bg-amber-50 text-amber-700",
    violet: "bg-violet-50 text-violet-700",
  };

  return (
    <div className="motion-card icon-pop rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
      <div className={`float-soft mb-4 inline-flex rounded-lg p-2 ${tones[tone]}`}>
        {icon}
      </div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
};

const PieChartPanel = ({ data, total }) => {
  const safeTotal = data.reduce((sum, item) => sum + item.value, 0);
  let current = 0;
  const gradient =
    safeTotal > 0
      ? data
          .map((item) => {
            const start = current;
            const end = current + (item.value / safeTotal) * 100;
            current = end;
            return `${item.color} ${start}% ${end}%`;
          })
          .join(", ")
      : "#e5e7eb 0% 100%";

  return (
    <div className="motion-card rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <PieChart className="text-indigo-600" size={20} />
        <h2 className="text-lg font-semibold text-gray-900">
          Expense Pie Chart
        </h2>
      </div>

      <div className="grid gap-6 md:grid-cols-[240px_1fr] md:items-center">
        <div className="relative mx-auto h-56 w-56">
          <div
            className="pie-reveal h-full w-full rounded-full shadow-inner"
            style={{ background: `conic-gradient(${gradient})` }}
          />
          <div className="absolute inset-12 flex flex-col items-center justify-center rounded-full bg-white text-center shadow-sm">
            <span className="text-xs font-semibold uppercase text-gray-500">
              Total
            </span>
            <span className="mt-1 text-lg font-bold text-gray-950">
              {currency.format(Number(total || 0))}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {data.length === 0 && (
            <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
              Add expenses to see category distribution.
            </p>
          )}

          {data.map((item) => {
            const percent = safeTotal ? Math.round((item.value / safeTotal) * 100) : 0;
            return (
              <div
                key={item.label}
                className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 p-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="truncate text-sm font-semibold text-gray-800">
                    {item.label}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{percent}%</p>
                  <p className="text-xs text-gray-500">
                    {currency.format(item.value)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const HighlightTile = ({ label, value, tone }) => {
  const tones = {
    emerald: "from-emerald-50 to-teal-50 text-emerald-700",
    rose: "from-rose-50 to-orange-50 text-rose-700",
    indigo: "from-indigo-50 to-sky-50 text-indigo-700",
    amber: "from-amber-50 to-yellow-50 text-amber-700",
  };

  return (
    <div className={`rounded-lg bg-gradient-to-br p-4 ${tones[tone]}`}>
      <p className="text-xs font-semibold uppercase opacity-75">{label}</p>
      <p className="mt-2 text-xl font-bold">{value}</p>
    </div>
  );
};

const MiniMetric = ({ label, value }) => (
  <div className="rounded-lg bg-gray-50 p-4">
    <p className="text-xs font-semibold uppercase text-gray-500">{label}</p>
    <p className="mt-1 text-lg font-bold text-gray-900">{value}</p>
  </div>
);

const VerticalBar = ({ label, value, max, color }) => (
  <div className="flex h-48 flex-col items-center justify-end gap-2">
    <div className="flex h-32 w-full items-end justify-center rounded-lg bg-gray-50 px-3">
      <div
        className={`animate-height w-full max-w-12 rounded-t-lg ${color}`}
        style={{
          height: `${Math.max((Number(value || 0) / max) * 100, 4)}%`,
        }}
      />
    </div>
    <p className="text-xs font-semibold text-gray-500">{label}</p>
    <p className="text-sm font-bold text-gray-900">
      {currency.format(Number(value || 0))}
    </p>
  </div>
);

const TrendLine = ({ label, value, max, color }) => (
  <div className="mb-2">
    <div className="mb-1 flex items-center justify-between text-xs text-gray-600">
      <span>{label}</span>
      <span>{currency.format(Number(value || 0))}</span>
    </div>
    <div className="h-2 overflow-hidden rounded-full bg-white">
      <div
        className={`animate-width h-full rounded-full ${color}`}
        style={{ width: `${Math.max((Number(value || 0) / max) * 100, 4)}%` }}
      />
    </div>
  </div>
);

const WidgetLine = ({ label, value }) => (
  <div className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 p-3">
    <span className="text-sm font-semibold text-gray-700">{label}</span>
    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-indigo-700">
      {value}
    </span>
  </div>
);

const StatusBadge = ({ status }) => {
  const classes =
    status === "Exceeded"
      ? "bg-red-50 text-red-700"
      : status === "Near limit"
        ? "bg-amber-50 text-amber-700"
        : status === "Completed"
          ? "bg-emerald-50 text-emerald-700"
          : "bg-indigo-50 text-indigo-700";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${classes}`}>
      {status}
    </span>
  );
};

const budgetColor = (status) => {
  if (status === "Exceeded") return "bg-red-500";
  if (status === "Near limit") return "bg-amber-500";
  return "bg-emerald-500";
};

export default Dashboard;
