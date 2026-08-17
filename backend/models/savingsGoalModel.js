import mongoose from "mongoose";

const savingsGoalSchema = new mongoose.Schema(
  {
    goalName: {
      type: String,
      required: true,
      trim: true,
    },
    targetAmount: {
      type: Number,
      required: true,
      min: 1,
    },
    currentAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    targetDate: {
      type: Date,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const savingsGoalModel =
  mongoose.models.savingsGoal ||
  mongoose.model("savingsGoal", savingsGoalSchema);

export default savingsGoalModel;
