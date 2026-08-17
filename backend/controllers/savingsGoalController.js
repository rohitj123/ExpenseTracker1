import savingsGoalModel from "../models/savingsGoalModel.js";

const getGoalStatus = (goal) => {
  const target = Number(goal.targetAmount || 0);
  const saved = Number(goal.currentAmount || 0);
  const progress = target > 0 ? Math.min(Math.round((saved / target) * 100), 100) : 0;
  const remaining = Math.max(target - saved, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(goal.targetDate);
  targetDate.setHours(0, 0, 0, 0);
  const daysLeft = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));

  let alert = "On track";
  if (saved >= target) {
    alert = "Completed";
  } else if (daysLeft < 0) {
    alert = "Target missed";
  } else if (daysLeft <= 7) {
    alert = "Due soon";
  }

  return {
    ...goal.toObject(),
    progress,
    remaining,
    daysLeft,
    alert,
  };
};

export async function addSavingsGoal(req, res) {
  const userId = req.user._id;
  const { goalName, targetAmount, currentAmount, targetDate } = req.body;

  try {
    if (!goalName || !targetAmount || currentAmount === undefined || !targetDate) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const goal = new savingsGoalModel({
      userId,
      goalName,
      targetAmount,
      currentAmount,
      targetDate,
    });
    await goal.save();

    res.json({
      success: true,
      message: "Savings goal added successfully!",
      data: getGoalStatus(goal),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

export async function getAllSavingsGoals(req, res) {
  try {
    const goals = await savingsGoalModel
      .find({ userId: req.user._id })
      .sort({ targetDate: 1, createdAt: -1 });

    res.json(goals.map(getGoalStatus));
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

export async function updateSavingsGoal(req, res) {
  const { id } = req.params;
  const { goalName, targetAmount, currentAmount, targetDate } = req.body;
  const updates = {};

  if (goalName !== undefined) updates.goalName = goalName;
  if (targetAmount !== undefined) updates.targetAmount = targetAmount;
  if (currentAmount !== undefined) updates.currentAmount = currentAmount;
  if (targetDate !== undefined) updates.targetDate = targetDate;

  try {
    const goal = await savingsGoalModel.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      updates,
      { new: true, runValidators: true }
    );

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: "Savings goal not found",
      });
    }

    res.json({
      success: true,
      message: "Savings goal updated successfully",
      data: getGoalStatus(goal),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

export async function deleteSavingsGoal(req, res) {
  try {
    const goal = await savingsGoalModel.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: "Savings goal not found",
      });
    }

    res.json({
      success: true,
      message: "Savings goal deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}
