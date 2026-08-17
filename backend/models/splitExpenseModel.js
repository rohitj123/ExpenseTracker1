import mongoose from "mongoose";

const participantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    amountOwed: {
      type: Number,
      required: true,
      min: 0,
    },
    settled: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const splitExpenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 1,
    },
    paidBy: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    participants: {
      type: [participantSchema],
      validate: {
        validator: (participants) => participants.length > 0,
        message: "At least one participant is required",
      },
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

const splitExpenseModel =
  mongoose.models.splitExpense ||
  mongoose.model("splitExpense", splitExpenseSchema);

export default splitExpenseModel;
