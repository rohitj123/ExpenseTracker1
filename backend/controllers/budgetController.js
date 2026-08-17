import budgetModel from "../models/budgetModel.js";
import expenseModel from "../models/expenseModel.js";

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

const withSpendStatus = async (budget) => {
  const { start, end } = getBudgetDateRange(budget.duration);
  const expenses = await expenseModel.find({
    userId: budget.userId,
    category: budget.category,
    date: { $gte: start, $lte: end },
  });
  const spent = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const limit = Number(budget.amount);
  const percentUsed = limit > 0 ? Math.round((spent / limit) * 100) : 0;

  return {
    ...budget.toObject(),
    spent,
    remaining: Math.max(limit - spent, 0),
    percentUsed,
    alert:
      spent >= limit
        ? "Exceeded"
        : percentUsed >= 80
          ? "Near limit"
          : "On track",
  };
};

export async function addBudget(req, res) {
  const userId = req.user._id;
  const { category, amount, duration } = req.body;

  try {
    if (!category || !amount || !duration) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const budget = new budgetModel({
      userId,
      category,
      amount,
      duration,
    });
    await budget.save();

    res.json({
      success: true,
      message: "Budget added successfully!",
      data: await withSpendStatus(budget),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

export async function getAllBudgets(req, res) {
  try {
    const budgets = await budgetModel
      .find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    const data = await Promise.all(budgets.map(withSpendStatus));

    res.json(data);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

export async function updateBudget(req, res) {
  const { id } = req.params;
  const { category, amount, duration } = req.body;
  const updates = {};

  if (category !== undefined) updates.category = category;
  if (amount !== undefined) updates.amount = amount;
  if (duration !== undefined) updates.duration = duration;

  try {
    const budget = await budgetModel.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      updates,
      { new: true, runValidators: true },
    );

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: "Budget not found",
      });
    }

    res.json({
      success: true,
      message: "Budget updated successfully",
      data: await withSpendStatus(budget),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

export async function deleteBudget(req, res) {
  try {
    const budget = await budgetModel.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: "Budget not found",
      });
    }

    res.json({
      success: true,
      message: "Budget deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}
