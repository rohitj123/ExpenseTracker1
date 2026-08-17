import familyFinanceModel from "../models/familyFinanceModel.js";

const parseMembers = (members) =>
  String(members || "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name, index) => ({
      name,
      role: index === 0 ? "Owner" : "Member",
    }));

const withSharedReport = (family) => {
  const data = family.toObject ? family.toObject() : family;
  const totalBudget = data.budgets.reduce(
    (sum, budget) => sum + Number(budget.amount || 0),
    0
  );
  const totalSpent = data.budgets.reduce(
    (sum, budget) => sum + Number(budget.spent || 0),
    0
  );

  return {
    ...data,
    sharedReport: {
      totalBudget,
      totalSpent,
      remainingBudget: Math.max(totalBudget - totalSpent, 0),
      walletBalance: Number(data.sharedWalletBalance || 0),
      memberCount: data.members.length,
      budgetCount: data.budgets.length,
    },
  };
};

export async function addFamily(req, res) {
  const userId = req.user._id;
  const { familyName, sharedWalletBalance, members } = req.body;

  try {
    if (!familyName || sharedWalletBalance === undefined) {
      return res.status(400).json({
        success: false,
        message: "Family name and shared wallet balance are required",
      });
    }

    const family = new familyFinanceModel({
      userId,
      familyName,
      sharedWalletBalance,
      members: parseMembers(members),
    });
    await family.save();

    res.json({
      success: true,
      message: "Family finance setup added successfully!",
      data: withSharedReport(family),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

export async function getFamilies(req, res) {
  try {
    const families = await familyFinanceModel
      .find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    res.json(families.map(withSharedReport));
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

export async function updateFamily(req, res) {
  const { id } = req.params;
  const { familyName, sharedWalletBalance, members } = req.body;
  const updates = {};

  if (familyName !== undefined) updates.familyName = familyName;
  if (sharedWalletBalance !== undefined) {
    updates.sharedWalletBalance = sharedWalletBalance;
  }
  if (members !== undefined) updates.members = parseMembers(members);

  try {
    const family = await familyFinanceModel.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      updates,
      { new: true, runValidators: true }
    );

    if (!family) {
      return res.status(404).json({
        success: false,
        message: "Family finance setup not found",
      });
    }

    res.json({
      success: true,
      message: "Family finance setup updated successfully",
      data: withSharedReport(family),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

export async function addFamilyBudget(req, res) {
  const { id } = req.params;
  const { category, amount, spent } = req.body;

  try {
    if (!category || !amount) {
      return res.status(400).json({
        success: false,
        message: "Budget category and amount are required",
      });
    }

    const family = await familyFinanceModel.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!family) {
      return res.status(404).json({
        success: false,
        message: "Family finance setup not found",
      });
    }

    family.budgets.push({
      category,
      amount,
      spent: spent || 0,
    });
    await family.save();

    res.json({
      success: true,
      message: "Family budget added successfully",
      data: withSharedReport(family),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

export async function updateFamilyBudget(req, res) {
  const { id, budgetId } = req.params;
  const { category, amount, spent } = req.body;

  try {
    const family = await familyFinanceModel.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!family) {
      return res.status(404).json({
        success: false,
        message: "Family finance setup not found",
      });
    }

    const budget = family.budgets.id(budgetId);

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: "Family budget not found",
      });
    }

    if (category !== undefined) budget.category = category;
    if (amount !== undefined) budget.amount = amount;
    if (spent !== undefined) budget.spent = spent;
    await family.save();

    res.json({
      success: true,
      message: "Family budget updated successfully",
      data: withSharedReport(family),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

export async function deleteFamily(req, res) {
  try {
    const family = await familyFinanceModel.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!family) {
      return res.status(404).json({
        success: false,
        message: "Family finance setup not found",
      });
    }

    res.json({
      success: true,
      message: "Family finance setup deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}
