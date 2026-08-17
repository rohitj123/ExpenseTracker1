import expenseModel from "../models/expenseModel.js";
import incomeModel from "../models/incomeModel.js";
import recurringTransactionModel from "../models/recurringTransactionModel.js";
import transferModel from "../models/transferModel.js";

const getNextDate = (date, recurrence) => {
  const nextDate = new Date(date);

  if (recurrence === "Daily") {
    nextDate.setDate(nextDate.getDate() + 1);
  } else if (recurrence === "Weekly") {
    nextDate.setDate(nextDate.getDate() + 7);
  } else {
    nextDate.setMonth(nextDate.getMonth() + 1);
  }

  return nextDate;
};

const createTransactionFromRecurring = async (item) => {
  const common = {
    userId: item.userId,
    amount: item.amount,
    date: new Date(item.nextDate),
  };

  if (item.transactionType === "Income") {
    return incomeModel.create({
      ...common,
      source: item.title,
      description: `${item.title} recurring income`,
      category: item.category || "Recurring",
    });
  }

  if (item.transactionType === "Expense") {
    return expenseModel.create({
      ...common,
      description: `${item.title} recurring expense`,
      category: item.category || "Recurring",
      paymentMethod: "Auto",
    });
  }

  return transferModel.create({
    ...common,
    description: `${item.title} recurring transfer`,
    status: "Completed",
  });
};

export async function addRecurringTransaction(req, res) {
  const userId = req.user._id;
  const { title, amount, transactionType, recurrence, nextDate, category, status } =
    req.body;

  try {
    if (!title || !amount || !transactionType || !recurrence || !nextDate) {
      return res.status(400).json({
        success: false,
        message: "Title, amount, type, recurrence, and next date are required",
      });
    }

    const recurring = new recurringTransactionModel({
      userId,
      title,
      amount,
      transactionType,
      recurrence,
      nextDate: new Date(nextDate),
      category: category || "General",
      status: status || "Active",
    });
    await recurring.save();

    res.json({
      success: true,
      message: "Recurring transaction added successfully!",
      data: recurring,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

export async function getAllRecurringTransactions(req, res) {
  try {
    const recurring = await recurringTransactionModel
      .find({ userId: req.user._id })
      .sort({ nextDate: 1, createdAt: -1 });

    res.json(recurring);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

export async function updateRecurringTransaction(req, res) {
  const { id } = req.params;
  const { title, amount, transactionType, recurrence, nextDate, category, status } =
    req.body;
  const updates = {};

  if (title !== undefined) updates.title = title;
  if (amount !== undefined) updates.amount = amount;
  if (transactionType !== undefined) updates.transactionType = transactionType;
  if (recurrence !== undefined) updates.recurrence = recurrence;
  if (nextDate !== undefined) updates.nextDate = new Date(nextDate);
  if (category !== undefined) updates.category = category;
  if (status !== undefined) updates.status = status;

  try {
    const recurring = await recurringTransactionModel.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      updates,
      { new: true, runValidators: true }
    );

    if (!recurring) {
      return res.status(404).json({
        success: false,
        message: "Recurring transaction not found",
      });
    }

    res.json({
      success: true,
      message: "Recurring transaction updated successfully",
      data: recurring,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

export async function deleteRecurringTransaction(req, res) {
  try {
    const recurring = await recurringTransactionModel.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!recurring) {
      return res.status(404).json({
        success: false,
        message: "Recurring transaction not found",
      });
    }

    res.json({
      success: true,
      message: "Recurring transaction deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

export async function processRecurringTransactions(req, res) {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  try {
    const dueItems = await recurringTransactionModel.find({
      userId: req.user._id,
      status: "Active",
      nextDate: { $lte: today },
    });

    const created = [];

    for (const item of dueItems) {
      await createTransactionFromRecurring(item);
      item.nextDate = getNextDate(item.nextDate, item.recurrence);
      await item.save();
      created.push(item);
    }

    res.json({
      success: true,
      message: `${created.length} automatic transaction(s) created`,
      data: created,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}
