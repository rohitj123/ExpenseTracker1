import budgetModel from "../models/budgetModel.js";
import expenseModel from "../models/expenseModel.js";
import incomeModel from "../models/incomeModel.js";
import savingsGoalModel from "../models/savingsGoalModel.js";
import subscriptionModel from "../models/subscriptionModel.js";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const sumAmount = (items) =>
  items.reduce((sum, item) => sum + Number(item.amount || 0), 0);

const getMonthlyCost = (subscription) => {
  if (subscription.billingCycle === "Yearly") {
    return Math.round(Number(subscription.amount || 0) / 12);
  }
  if (subscription.billingCycle === "Quarterly") {
    return Math.round(Number(subscription.amount || 0) / 3);
  }
  return Number(subscription.amount || 0);
};

const getCurrentMonthRange = () => {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: now,
    daysElapsed: now.getDate(),
    daysInMonth: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(),
  };
};

const getCategoryTotals = (expenses) =>
  expenses.reduce((map, expense) => {
    const category = expense.category || "Other";
    map[category] = (map[category] || 0) + Number(expense.amount || 0);
    return map;
  }, {});

const getScoreLabel = (score) => {
  if (score >= 80) return "Excellent";
  if (score >= 65) return "Good";
  if (score >= 45) return "Needs attention";
  return "At risk";
};

export async function getAdvisorInsights(req, res) {
  const userId = req.user._id;
  const { start, end, daysElapsed, daysInMonth } = getCurrentMonthRange();

  try {
    const [incomes, expenses, monthlyExpenses, budgets, goals, subscriptions] =
      await Promise.all([
        incomeModel.find({ userId }).lean(),
        expenseModel.find({ userId }).lean(),
        expenseModel.find({ userId, date: { $gte: start, $lte: end } }).lean(),
        budgetModel.find({ userId }).lean(),
        savingsGoalModel.find({ userId }).lean(),
        subscriptionModel.find({ userId }).lean(),
      ]);

    const totalIncome = sumAmount(incomes);
    const totalExpense = sumAmount(expenses);
    const totalSavings = totalIncome - totalExpense;
    const savingsRate =
      totalIncome > 0 ? Math.round((totalSavings / totalIncome) * 100) : 0;
    const categoryTotals = getCategoryTotals(expenses);
    const topCategoryEntry =
      Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0] || [];
    const monthlySpent = sumAmount(monthlyExpenses);
    const dailyAverage =
      daysElapsed > 0 ? Math.round(monthlySpent / daysElapsed) : 0;
    const predictedMonthEndSpend = dailyAverage * daysInMonth;
    const activeSubscriptions = subscriptions.filter(
      (subscription) => subscription.status === "Active"
    );
    const monthlySubscriptionCost = activeSubscriptions.reduce(
      (sum, subscription) => sum + getMonthlyCost(subscription),
      0
    );

    const budgetRecommendations = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, amount]) => {
        const existingBudget = budgets.find((budget) => budget.category === category);
        const recommendedBudget = Math.max(Math.round(amount * 0.9), 1000);

        return {
          category,
          currentSpend: amount,
          recommendedBudget,
          reason: existingBudget
            ? `${category} already has a budget. Consider tightening it if spending feels high.`
            : `${category} is a major spend area. Add a budget to control it automatically.`,
        };
      });

    const savingsSuggestions = [];

    if (savingsRate < 20) {
      savingsSuggestions.push({
        title: "Improve savings rate",
        message: "Try moving at least 20% of income to savings before spending.",
        potentialSavings: Math.max(Math.round(totalIncome * 0.2 - totalSavings), 0),
      });
    }

    if (topCategoryEntry[0]) {
      savingsSuggestions.push({
        title: `Reduce ${topCategoryEntry[0]} spending`,
        message: `A 10% reduction in ${topCategoryEntry[0]} can free up money for goals.`,
        potentialSavings: Math.round(Number(topCategoryEntry[1]) * 0.1),
      });
    }

    if (monthlySubscriptionCost > 0) {
      savingsSuggestions.push({
        title: "Review subscriptions",
        message: "Cancel or pause subscriptions that are not used every month.",
        potentialSavings: Math.round(monthlySubscriptionCost * 0.25),
      });
    }

    const subscriptionDetection = activeSubscriptions
      .map((subscription) => ({
        name: subscription.name,
        monthlyCost: getMonthlyCost(subscription),
        reason:
          getMonthlyCost(subscription) >= 1000
            ? "High monthly impact. Review whether it is still useful."
            : "Active subscription. Keep only if it is used regularly.",
      }))
      .sort((a, b) => b.monthlyCost - a.monthlyCost);

    const budgetPenalty = budgets.length === 0 ? 10 : 0;
    const overspendingPenalty = totalIncome > 0 && totalExpense > totalIncome ? 25 : 0;
    const savingsPenalty = savingsRate < 10 ? 20 : savingsRate < 20 ? 10 : 0;
    const subscriptionPenalty =
      totalIncome > 0 && monthlySubscriptionCost > totalIncome * 0.1 ? 10 : 0;
    const goalBonus =
      goals.length > 0
        ? Math.min(
            Math.round(
              goals.reduce((sum, goal) => {
                const progress =
                  Number(goal.targetAmount) > 0
                    ? Number(goal.currentAmount || 0) / Number(goal.targetAmount)
                    : 0;
                return sum + progress;
              }, 0) / goals.length * 10
            ),
            10
          )
        : 0;
    const score = clamp(
      75 - budgetPenalty - overspendingPenalty - savingsPenalty - subscriptionPenalty + goalBonus,
      0,
      100
    );

    res.json({
      success: true,
      data: {
        spendingAnalysis: {
          totalIncome,
          totalExpense,
          totalSavings,
          savingsRate,
          topCategory: topCategoryEntry[0] || "No spending yet",
          topCategoryAmount: topCategoryEntry[1] || 0,
          expenseCount: expenses.length,
        },
        budgetRecommendations,
        savingsSuggestions,
        expensePrediction: {
          currentMonthSpent: monthlySpent,
          dailyAverage,
          predictedMonthEndSpend,
          message:
            predictedMonthEndSpend > monthlySpent
              ? "Future spending is forecast using this month's daily average."
              : "Add more current month expenses to improve prediction accuracy.",
        },
        subscriptionDetection,
        financialHealthScore: {
          score,
          label: getScoreLabel(score),
          reasons: [
            savingsRate >= 20
              ? "Savings rate is healthy."
              : "Savings rate needs improvement.",
            budgets.length > 0
              ? "Budgets are configured."
              : "Add budgets for stronger control.",
            monthlySubscriptionCost > 0
              ? "Subscriptions are included in monthly cost checks."
              : "No active subscriptions detected.",
          ],
        },
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}
