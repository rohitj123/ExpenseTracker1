import mongoose from "mongoose";

const familyMemberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      default: "Member",
      trim: true,
    },
  },
  { _id: true }
);

const familyBudgetSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    spent: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
  },
  { _id: true }
);

const familyFinanceSchema = new mongoose.Schema(
  {
    familyName: {
      type: String,
      required: true,
      trim: true,
    },
    sharedWalletBalance: {
      type: Number,
      required: true,
      default: 0,
    },
    members: {
      type: [familyMemberSchema],
      default: [],
    },
    budgets: {
      type: [familyBudgetSchema],
      default: [],
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

const familyFinanceModel =
  mongoose.models.familyFinance ||
  mongoose.model("familyFinance", familyFinanceSchema);

export default familyFinanceModel;
