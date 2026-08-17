import expenseModel from "../models/expenseModel.js";
import incomeModel from "../models/incomeModel.js";

const getDateRange = (range) => {
  const now = new Date();
  const end = new Date();

  if (range === "daily") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }

  if (range === "weekly") {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }

  if (range === "yearly") {
    return {
      start: new Date(now.getFullYear(), 0, 1),
      end,
    };
  }

  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end,
  };
};

const sumAmount = (items) =>
  items.reduce((sum, item) => sum + Number(item.amount || 0), 0);

const getMonthKey = (date) => {
  const value = new Date(date);
  return value.toLocaleString("en-IN", {
    month: "short",
    year: "numeric",
  });
};

export async function getReports(req, res) {
  const userId = req.user._id;
  const range = req.query.range || "monthly";
  const { start, end } = getDateRange(range);

  try {
    const [expenses, income, allExpenses, allIncome] = await Promise.all([
      expenseModel.find({ userId, date: { $gte: start, $lte: end } }),
      incomeModel.find({ userId, date: { $gte: start, $lte: end } }),
      expenseModel.find({ userId }).sort({ date: 1 }),
      incomeModel.find({ userId }),
    ]);

    const totalExpense = sumAmount(expenses);
    const totalIncome = sumAmount(income);
    const totalSavings = totalIncome - totalExpense;
    const savingsRate =
      totalIncome > 0 ? Math.round((totalSavings / totalIncome) * 100) : 0;

    const topCategoryMap = expenses.reduce((map, expense) => {
      const category = expense.category || "Other";
      map[category] = (map[category] || 0) + Number(expense.amount || 0);
      return map;
    }, {});

    const topCategories = Object.entries(topCategoryMap)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    const monthlyExpenseMap = allExpenses.reduce((map, expense) => {
      const month = getMonthKey(expense.date);
      map[month] = (map[month] || 0) + Number(expense.amount || 0);
      return map;
    }, {});

    const monthlyIncomeMap = allIncome.reduce((map, item) => {
      const month = getMonthKey(item.date);
      map[month] = (map[month] || 0) + Number(item.amount || 0);
      return map;
    }, {});

    const months = Array.from(
      new Set([
        ...Object.keys(monthlyExpenseMap),
        ...Object.keys(monthlyIncomeMap),
      ])
    ).slice(-6);

    const monthlyTrends = months.map((month) => ({
      month,
      expense: monthlyExpenseMap[month] || 0,
      income: monthlyIncomeMap[month] || 0,
    }));

    res.json({
      success: true,
      data: {
        range,
        expenseReport: {
          totalExpense,
          count: expenses.length,
          averageExpense:
            expenses.length > 0 ? Math.round(totalExpense / expenses.length) : 0,
        },
        analytics: {
          totalIncome,
          totalExpense,
          totalSavings,
          savingsRate,
          topCategories,
          monthlyTrends,
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
