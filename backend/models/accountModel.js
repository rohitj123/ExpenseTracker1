import mongoose from "mongoose";

const accountSchema = new mongoose.Schema(
  {
    bankName: {
      type: String,
      required: true,
      trim: true,
    },
    accountType: {
      type: String,
      enum: ["Savings", "Current", "Wallet", "Credit Card"],
      required: true,
    },
    balance: {
      type: Number,
      required: true,
      default: 0,
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

const accountModel =
  mongoose.models.account || mongoose.model("account", accountSchema);

export default accountModel;
