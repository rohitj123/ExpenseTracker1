import mongoose from "mongoose";

const recurringTransactionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    transactionType: {
      type: String,
      enum: ["Income", "Expense", "Transfer"],
      required: true,
    },
    recurrence: {
      type: String,
      enum: ["Daily", "Weekly", "Monthly"],
      required: true,
    },
    nextDate: {
      type: Date,
      required: true,
    },
    category: {
      type: String,
      default: "General",
    },
    status: {
      type: String,
      enum: ["Active", "Paused"],
      default: "Active",
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

const recurringTransactionModel =
  mongoose.models.recurringTransaction ||
  mongoose.model("recurringTransaction", recurringTransactionSchema);

export default recurringTransactionModel;
