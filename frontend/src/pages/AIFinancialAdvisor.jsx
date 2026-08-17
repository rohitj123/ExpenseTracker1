import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  AlertTriangle,
  BarChart3,
  CreditCard,
  IndianRupee,
  PiggyBank,
  RefreshCw,
  Target,
  TrendingUp,
  WalletCards,
} from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const getAdvisorErrorMessage = (error, fallback) => {
  if (!localStorage.getItem("token")) {
    return "Please sign in to load AI financial advisor insights.";
  }

  if (!error.response) {
    return "Advisor server is not reachable. Start the backend on port 4000 and try again.";
  }

  if (error.response.status === 401) {
    return "Your session has expired. Please sign in again.";
  }

  return error.response?.data?.message || fallback;
};

const AIFinancialAdvisor = () => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const authHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchInsights = async () => {
    if (!localStorage.getItem("token")) {
      setInsights(null);
      setMessage("Please sign in to load AI financial advisor insights.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await axios.get(`${BASE_URL}/advisor/get`, {
        headers: authHeaders(),
      });
      setInsights(response.data?.data || null);
    } catch (error) {
      setMessage(getAdvisorErrorMessage(error, "Unable to load advisor insights."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const score = insights?.financialHealthScore?.score || 0;
  const maxRecommendationAmount = useMemo(() => {
    return Math.max(
      ...(insights?.budgetRecommendations || []).map((item) =>
        Number(item.currentSpend || 0)
      ),
      1
    );
  }, [insights]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            AI Financial Advisor
          </h1>
          <p className="text-sm text-gray-600">
            Get smart insights for spending, budgets, savings, predictions, and subscriptions.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchInsights}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
        >
          <RefreshCw size={16} />
          Refresh Insights
        </button>
      </div>

      {message && (
        <p className="rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-800">
          {message}
        </p>
      )}

      {loading && (
        <p className="rounded-lg bg-white p-5 text-sm text-gray-500 shadow-sm">
          Analyzing financial behavior...
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          icon={<BarChart3 size={20} />}
          label="Financial Health Score"
          value={`${score}/100`}
        />
        <SummaryCard
          icon={<PiggyBank size={20} />}
          label="Savings Rate"
          value={`${insights?.spendingAnalysis?.savingsRate || 0}%`}
        />
        <SummaryCard
          icon={<TrendingUp size={20} />}
          label="Predicted Expense"
          value={currency.format(
            Number(insights?.expensePrediction?.predictedMonthEndSpend || 0)
          )}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <WalletCards className="text-indigo-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">
              Spending Analysis
            </h2>
          </div>

          <div className="space-y-3">
            <Metric
              label="Total Income"
              value={currency.format(Number(insights?.spendingAnalysis?.totalIncome || 0))}
            />
            <Metric
              label="Total Expense"
              value={currency.format(Number(insights?.spendingAnalysis?.totalExpense || 0))}
            />
            <Metric
              label="Top Category"
              value={`${insights?.spendingAnalysis?.topCategory || "No spending yet"} (${currency.format(Number(insights?.spendingAnalysis?.topCategoryAmount || 0))})`}
            />
            <Metric
              label="Expense Count"
              value={insights?.spendingAnalysis?.expenseCount || 0}
            />
          </div>
        </div>

        <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <Target className="text-indigo-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">
              Budget Recommendations
            </h2>
          </div>

          <div className="space-y-4">
            {(insights?.budgetRecommendations || []).length === 0 && (
              <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
                Add expenses to receive automatic budget recommendations.
              </p>
            )}

            {(insights?.budgetRecommendations || []).map((item) => (
              <div key={item.category}>
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-gray-900">
                    {item.category}
                  </span>
                  <span className="text-gray-600">
                    Suggested: {currency.format(Number(item.recommendedBudget || 0))}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-indigo-500"
                    style={{
                      width: `${Math.max((Number(item.currentSpend || 0) / maxRecommendationAmount) * 100, 6)}%`,
                    }}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">{item.reason}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <AdvisorPanel
          icon={<PiggyBank size={20} />}
          title="Savings Suggestions"
          empty="Add income and expense data to receive savings opportunities."
        >
          {(insights?.savingsSuggestions || []).map((item) => (
            <InsightItem
              key={item.title}
              title={item.title}
              detail={item.message}
              value={currency.format(Number(item.potentialSavings || 0))}
            />
          ))}
        </AdvisorPanel>

        <AdvisorPanel
          icon={<TrendingUp size={20} />}
          title="Expense Prediction"
          empty="Add current month expenses to forecast future spending."
        >
          <InsightItem
            title="Current Month Spend"
            detail={insights?.expensePrediction?.message || "Prediction uses current month daily average."}
            value={currency.format(Number(insights?.expensePrediction?.currentMonthSpent || 0))}
          />
          <InsightItem
            title="Daily Average"
            detail="Average spend per day this month."
            value={currency.format(Number(insights?.expensePrediction?.dailyAverage || 0))}
          />
        </AdvisorPanel>

        <AdvisorPanel
          icon={<CreditCard size={20} />}
          title="Subscription Detection"
          empty="No active subscriptions detected."
        >
          {(insights?.subscriptionDetection || []).map((item) => (
            <InsightItem
              key={item.name}
              title={item.name}
              detail={item.reason}
              value={currency.format(Number(item.monthlyCost || 0))}
            />
          ))}
        </AdvisorPanel>
      </div>

      <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <AlertTriangle className="text-indigo-600" size={20} />
          <h2 className="text-lg font-semibold text-gray-900">
            Financial Health Score
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-[220px_1fr]">
          <div className="rounded-lg bg-indigo-50 p-5 text-center">
            <p className="text-sm font-semibold text-indigo-700">
              {insights?.financialHealthScore?.label || "No score"}
            </p>
            <p className="mt-2 text-5xl font-bold text-indigo-700">{score}</p>
            <p className="mt-1 text-sm text-indigo-700">out of 100</p>
          </div>

          <div className="space-y-3">
            {(insights?.financialHealthScore?.reasons || []).map((reason) => (
              <div
                key={reason}
                className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-700"
              >
                {reason}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const AdvisorPanel = ({ icon, title, empty, children }) => {
  const hasChildren = React.Children.count(children) > 0;

  return (
    <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <span className="text-indigo-600">{icon}</span>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="space-y-3">
        {hasChildren ? (
          children
        ) : (
          <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
            {empty}
          </p>
        )}
      </div>
    </div>
  );
};

const InsightItem = ({ title, detail, value }) => (
  <article className="rounded-lg bg-gray-50 p-4">
    <div className="flex items-start justify-between gap-3">
      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="mt-1 text-sm text-gray-600">{detail}</p>
      </div>
      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-indigo-700">
        {value}
      </span>
    </div>
  </article>
);

const Metric = ({ label, value }) => (
  <div className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 p-4">
    <span className="text-sm font-semibold text-gray-600">{label}</span>
    <span className="text-sm font-bold text-gray-900">{value}</span>
  </div>
);

const SummaryCard = ({ icon, label, value }) => (
  <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
    <div className="mb-4 inline-flex rounded-lg bg-indigo-50 p-2 text-indigo-700">
      {icon}
    </div>
    <p className="text-sm font-medium text-gray-500">{label}</p>
    <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
  </div>
);

export default AIFinancialAdvisor;
