import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    billingCycle: {
      type: String,
      enum: ["Monthly", "Quarterly", "Yearly"],
      required: true,
      default: "Monthly",
    },
    renewalDate: {
      type: Date,
      required: true,
    },
    category: {
      type: String,
      default: "Subscription",
      trim: true,
    },
    status: {
      type: String,
      enum: ["Active", "Paused", "Cancelled"],
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

const subscriptionModel =
  mongoose.models.subscription ||
  mongoose.model("subscription", subscriptionSchema);

export default subscriptionModel;
