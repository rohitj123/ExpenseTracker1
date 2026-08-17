import mongoose from "mongoose";

const transferSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["Completed", "Pending", "Failed"],
      default: "Completed",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    type: {
      type: String,
      default: "transfer",
    },
  },
  {
    timestamps: true,
  }
);

const transferModel =
  mongoose.models.transfer || mongoose.model("transfer", transferSchema);

export default transferModel;
