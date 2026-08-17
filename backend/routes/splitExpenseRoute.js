import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  addSplitExpense,
  deleteSplitExpense,
  getAllSplitExpenses,
  updateSettlement,
  updateSplitExpense,
} from "../controllers/splitExpenseController.js";

const splitExpenseRouter = express.Router();

splitExpenseRouter.post("/add", authMiddleware, addSplitExpense);
splitExpenseRouter.get("/get", authMiddleware, getAllSplitExpenses);
splitExpenseRouter.put("/update/:id", authMiddleware, updateSplitExpense);
splitExpenseRouter.patch(
  "/settlement/:id/:participantId",
  authMiddleware,
  updateSettlement
);
splitExpenseRouter.delete("/delete/:id", authMiddleware, deleteSplitExpense);

export default splitExpenseRouter;
