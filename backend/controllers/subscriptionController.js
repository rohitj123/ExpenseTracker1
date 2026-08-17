import subscriptionModel from "../models/subscriptionModel.js";

const getMonthlyCost = (amount, billingCycle) => {
  if (billingCycle === "Yearly") return Math.round(Number(amount || 0) / 12);
  if (billingCycle === "Quarterly") return Math.round(Number(amount || 0) / 3);
  return Number(amount || 0);
};

const getDaysLeft = (date) => {
  const today = new Date();
  const target = new Date(date);
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
};

const withReminder = (subscription) => {
  const data = subscription.toObject ? subscription.toObject() : subscription;
  const daysLeft = getDaysLeft(data.renewalDate);
  const monthlyCost = getMonthlyCost(data.amount, data.billingCycle);

  return {
    ...data,
    monthlyCost,
    daysLeft,
    reminder:
      data.status !== "Active"
        ? "Inactive"
        : daysLeft < 0
          ? "Overdue"
          : daysLeft <= 7
            ? "Renewal due"
            : "On track",
  };
};

export async function addSubscription(req, res) {
  const userId = req.user._id;
  const { name, amount, billingCycle, renewalDate, category, status } = req.body;

  try {
    if (!name || !amount || !billingCycle || !renewalDate) {
      return res.status(400).json({
        success: false,
        message: "Name, amount, billing cycle, and renewal date are required",
      });
    }

    const subscription = new subscriptionModel({
      userId,
      name,
      amount,
      billingCycle,
      renewalDate: new Date(renewalDate),
      category: category || "Subscription",
      status: status || "Active",
    });
    await subscription.save();

    res.json({
      success: true,
      message: "Subscription added successfully!",
      data: withReminder(subscription),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

export async function getAllSubscriptions(req, res) {
  try {
    const subscriptions = await subscriptionModel
      .find({ userId: req.user._id })
      .sort({ renewalDate: 1, createdAt: -1 });

    res.json(subscriptions.map(withReminder));
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

export async function updateSubscription(req, res) {
  const { id } = req.params;
  const { name, amount, billingCycle, renewalDate, category, status } = req.body;
  const updates = {};

  if (name !== undefined) updates.name = name;
  if (amount !== undefined) updates.amount = amount;
  if (billingCycle !== undefined) updates.billingCycle = billingCycle;
  if (renewalDate !== undefined) updates.renewalDate = new Date(renewalDate);
  if (category !== undefined) updates.category = category;
  if (status !== undefined) updates.status = status;

  try {
    const subscription = await subscriptionModel.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      updates,
      { new: true, runValidators: true }
    );

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    res.json({
      success: true,
      message: "Subscription updated successfully",
      data: withReminder(subscription),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

export async function deleteSubscription(req, res) {
  try {
    const subscription = await subscriptionModel.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    res.json({
      success: true,
      message: "Subscription deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}
