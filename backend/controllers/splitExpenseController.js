import splitExpenseModel from "../models/splitExpenseModel.js";

const buildParticipants = (names, totalAmount) => {
  const cleanNames = String(names)
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
  const amountOwed =
    cleanNames.length > 0
      ? Math.round((Number(totalAmount) / cleanNames.length) * 100) / 100
      : 0;

  return cleanNames.map((name) => ({
    name,
    amountOwed,
    settled: false,
  }));
};

const withSettlementStatus = (expense) => {
  const data = expense.toObject();
  const settledCount = data.participants.filter((person) => person.settled).length;
  const totalPeople = data.participants.length;
  const pendingAmount = data.participants
    .filter((person) => !person.settled)
    .reduce((sum, person) => sum + Number(person.amountOwed || 0), 0);

  return {
    ...data,
    perPersonAmount: totalPeople > 0 ? Number(data.totalAmount) / totalPeople : 0,
    settledCount,
    pendingCount: totalPeople - settledCount,
    pendingAmount,
    status: settledCount === totalPeople ? "Settled" : "Pending",
  };
};

export async function addSplitExpense(req, res) {
  const userId = req.user._id;
  const { title, totalAmount, paidBy, date, participants } = req.body;

  try {
    if (!title || !totalAmount || !paidBy || !date || !participants) {
      return res.status(400).json({
        success: false,
        message: "Title, amount, paid by, date, and participants are required",
      });
    }

    const people = buildParticipants(participants, totalAmount);

    if (people.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Add at least one participant",
      });
    }

    const splitExpense = new splitExpenseModel({
      userId,
      title,
      totalAmount,
      paidBy,
      date: new Date(date),
      participants: people,
    });
    await splitExpense.save();

    res.json({
      success: true,
      message: "Split expense added successfully!",
      data: withSettlementStatus(splitExpense),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

export async function getAllSplitExpenses(req, res) {
  try {
    const expenses = await splitExpenseModel
      .find({ userId: req.user._id })
      .sort({ date: -1, createdAt: -1 });

    res.json(expenses.map(withSettlementStatus));
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

export async function updateSplitExpense(req, res) {
  const { id } = req.params;
  const { title, totalAmount, paidBy, date, participants } = req.body;
  const updates = {};

  if (title !== undefined) updates.title = title;
  if (totalAmount !== undefined) updates.totalAmount = totalAmount;
  if (paidBy !== undefined) updates.paidBy = paidBy;
  if (date !== undefined) updates.date = new Date(date);
  if (participants !== undefined) {
    updates.participants = buildParticipants(participants, totalAmount);
  }

  try {
    const splitExpense = await splitExpenseModel.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      updates,
      { new: true, runValidators: true }
    );

    if (!splitExpense) {
      return res.status(404).json({
        success: false,
        message: "Split expense not found",
      });
    }

    res.json({
      success: true,
      message: "Split expense updated successfully",
      data: withSettlementStatus(splitExpense),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

export async function updateSettlement(req, res) {
  const { id, participantId } = req.params;
  const { settled } = req.body;

  try {
    const splitExpense = await splitExpenseModel.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!splitExpense) {
      return res.status(404).json({
        success: false,
        message: "Split expense not found",
      });
    }

    const participant = splitExpense.participants.id(participantId);

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: "Participant not found",
      });
    }

    participant.settled = Boolean(settled);
    await splitExpense.save();

    res.json({
      success: true,
      message: "Settlement updated successfully",
      data: withSettlementStatus(splitExpense),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

export async function deleteSplitExpense(req, res) {
  try {
    const splitExpense = await splitExpenseModel.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!splitExpense) {
      return res.status(404).json({
        success: false,
        message: "Split expense not found",
      });
    }

    res.json({
      success: true,
      message: "Split expense deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}
