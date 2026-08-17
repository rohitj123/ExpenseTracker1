import incomeModel from "../models/incomeModel.js";
import expenseModel from "../models/expenseModel.js";
import budgetModel from "../models/budgetModel.js";
import savingsGoalModel from "../models/savingsGoalModel.js";

const getBudgetDateRange = (duration) => {
  const now = new Date();
  const end = new Date();

  if (duration === "Weekly") {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }

  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end,
  };
};

const getMonthKey = (date) =>
  new Date(date).toLocaleString("en-IN", {
    month: "short",
    year: "numeric",
  });

export async function getDashboardOverview(req, res) {
  try {
    const userId = req.user._id;

    const [incomes, expenses, budgets, goals] = await Promise.all([
      incomeModel.find({ userId }).lean(),
      expenseModel.find({ userId }).lean(),
      budgetModel.find({ userId }).lean(),
      savingsGoalModel.find({ userId }).lean(),
    ]);

    const totalIncome = incomes.reduce(
      (acc, cur) => acc + Number(cur.amount || 0),
      0
    );

    const totalExpense = expenses.reduce(
      (acc, cur) => acc + Number(cur.amount || 0),
      0
    );

    const savings = totalIncome - totalExpense;
    const savingsRate =
      totalIncome === 0 ? 0 : Math.round((savings / totalIncome) * 100);

    const recentTransactions = [
      ...incomes.map((i) => ({ ...i, type: "income" })),
      ...expenses.map((e) => ({ ...e, type: "expense" })),
    ]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    const spendByCategory = {};

    for (const exp of expenses) {
      const category = exp.category || "Other";
      spendByCategory[category] =
        (spendByCategory[category] || 0) + Number(exp.amount || 0);
    }

    const expenseDistribution = Object.entries(spendByCategory).map(
      ([category, amount]) => ({
        category,
        amount,
        percent:
          totalExpense === 0 ? 0 : Math.round((amount / totalExpense) * 100),
      })
    );

    const trendMap = {};

    for (const income of incomes) {
      const month = getMonthKey(income.date || income.createdAt);
      trendMap[month] = trendMap[month] || { month, income: 0, expense: 0 };
      trendMap[month].income += Number(income.amount || 0);
    }

    for (const expense of expenses) {
      const month = getMonthKey(expense.date || expense.createdAt);
      trendMap[month] = trendMap[month] || { month, income: 0, expense: 0 };
      trendMap[month].expense += Number(expense.amount || 0);
    }

    const monthlyTrends = Object.values(trendMap)
      .map((trend) => ({
        ...trend,
        savings: trend.income - trend.expense,
      }))
      .slice(-6);

    const budgetStatus = await Promise.all(
      budgets.map(async (budget) => {
        const { start, end } = getBudgetDateRange(budget.duration);
        const budgetExpenses = await expenseModel.find({
          userId,
          category: budget.category,
          date: { $gte: start, $lte: end },
        });
        const spent = budgetExpenses.reduce(
          (sum, expense) => sum + Number(expense.amount || 0),
          0
        );
        const amount = Number(budget.amount || 0);
        const percentUsed = amount > 0 ? Math.round((spent / amount) * 100) : 0;

        return {
          _id: budget._id,
          category: budget.category,
          amount,
          spent,
          remaining: Math.max(amount - spent, 0),
          percentUsed,
          status:
            spent >= amount
              ? "Exceeded"
              : percentUsed >= 90
                ? "Near limit"
                : "On track",
        };
      })
    );

    const goalStatus = goals.map((goal) => {
      const targetAmount = Number(goal.targetAmount || 0);
      const currentAmount = Number(goal.currentAmount || 0);
      const progress =
        targetAmount > 0
          ? Math.min(Math.round((currentAmount / targetAmount) * 100), 100)
          : 0;

      return {
        _id: goal._id,
        goalName: goal.goalName,
        targetAmount,
        currentAmount,
        progress,
        status: currentAmount >= targetAmount ? "Completed" : "In progress",
      };
    });

    const budgetSummary = {
      totalBudgets: budgets.length,
      exceeded: budgetStatus.filter((budget) => budget.status === "Exceeded")
        .length,
      nearLimit: budgetStatus.filter((budget) => budget.status === "Near limit")
        .length,
      onTrack: budgetStatus.filter((budget) => budget.status === "On track")
        .length,
    };

    const goalsSummary = {
      totalGoals: goals.length,
      completed: goalStatus.filter((goal) => goal.status === "Completed").length,
      inProgress: goalStatus.filter((goal) => goal.status === "In progress")
        .length,
    };

    return res.status(200).json({
      success: true,
      data: {
        monthlyIncome: totalIncome,
        monthlyExpense: totalExpense,
        totalIncome,
        totalExpense,
        currentSavings: savings,
        savings,
        savingsRate,
        recentTransactions,
        spendByCategory,
        expenseDistribution,
        monthlyTrends,
        budgetSummary,
        budgetStatus,
        goalsSummary,
        goalStatus,
      },
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    return res.status(500).json({
      success: false,
      message: "Dashboard fetch failed",
    });
  }
}
