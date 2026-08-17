import mongoose from "mongoose";

const budgetSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    duration: {
      type: String,
      enum: ["Weekly", "Monthly"],
      required: true,
      default: "Monthly",
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

const budgetModel =
  mongoose.models.budget || mongoose.model("budget", budgetSchema);

export default budgetModel;
