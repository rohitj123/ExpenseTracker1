import accountModel from "../models/accountModel.js";
import budgetModel from "../models/budgetModel.js";
import expenseModel from "../models/expenseModel.js";
import recurringTransactionModel from "../models/recurringTransactionModel.js";
import savingsGoalModel from "../models/savingsGoalModel.js";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

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

const daysUntil = (date) => {
  const today = new Date();
  const target = new Date(date);
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
};

const buildNotification = ({ id, title, message, type, priority, amount }) => ({
  id,
  title,
  message,
  type,
  priority,
  amount,
  createdAt: new Date(),
});

export async function getNotifications(req, res) {
  const userId = req.user._id;

  try {
    const [budgets, accounts, goals, recurring] = await Promise.all([
      budgetModel.find({ userId }),
      accountModel.find({ userId }),
      savingsGoalModel.find({ userId }),
      recurringTransactionModel.find({ userId, status: "Active" }),
    ]);

    const alerts = [];

    for (const budget of budgets) {
      const { start, end } = getBudgetDateRange(budget.duration);
      const expenses = await expenseModel.find({
        userId,
        category: budget.category,
        date: { $gte: start, $lte: end },
      });
      const spent = expenses.reduce(
        (sum, expense) => sum + Number(expense.amount || 0),
        0
      );
      const percentUsed =
        Number(budget.amount) > 0
          ? Math.round((spent / Number(budget.amount)) * 100)
          : 0;

      if (percentUsed >= 100) {
        alerts.push(
          buildNotification({
            id: `budget-exceeded-${budget._id}`,
            title: "Budget Exceeded",
            message: `${budget.category} budget exceeded at ${percentUsed}% used.`,
            type: "Budget Exceeded",
            priority: "High",
            amount: spent,
          })
        );
      } else if (percentUsed >= 90) {
        alerts.push(
          buildNotification({
            id: `budget-warning-${budget._id}`,
            title: `${budget.category} Budget Reached ${percentUsed}%`,
            message: `${budget.category} spending is near the ${currency.format(Number(budget.amount))} limit.`,
            type: "Budget Warning",
            priority: "Medium",
            amount: spent,
          })
        );
      }
    }

    accounts
      .filter((account) => Number(account.balance) <= 1000)
      .forEach((account) => {
        alerts.push(
          buildNotification({
            id: `low-balance-${account._id}`,
            title: "Low Balance",
            message: `${account.bankName} ${account.accountType} balance is ${currency.format(Number(account.balance || 0))}.`,
            type: "Low Balance",
            priority: "High",
            amount: account.balance,
          })
        );
      });

    goals
      .filter(
        (goal) => Number(goal.currentAmount) >= Number(goal.targetAmount)
      )
      .forEach((goal) => {
        alerts.push(
          buildNotification({
            id: `goal-achieved-${goal._id}`,
            title: "Goal Achieved",
            message: `${goal.goalName} savings goal has been completed.`,
            type: "Goal Achieved",
            priority: "Low",
            amount: goal.currentAmount,
          })
        );
      });

    recurring
      .filter((item) => {
        const daysLeft = daysUntil(item.nextDate);
        return daysLeft >= 0 && daysLeft <= 7;
      })
      .forEach((item) => {
        const daysLeft = daysUntil(item.nextDate);
        const isEmi = item.title.toLowerCase().includes("emi");
        const type = isEmi ? "Upcoming EMI" : "Recurring Expense";

        alerts.push(
          buildNotification({
            id: `recurring-${item._id}`,
            title: type,
            message: `${item.title} is due ${daysLeft === 0 ? "today" : `in ${daysLeft} day(s)`}.`,
            type,
            priority: isEmi ? "High" : "Medium",
            amount: item.amount,
          })
        );
      });

    res.json(
      alerts.sort((a, b) => {
        const priority = { High: 0, Medium: 1, Low: 2 };
        return priority[a.priority] - priority[b.priority];
      })
    );
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}
