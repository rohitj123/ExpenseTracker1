import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  addRecurringTransaction,
  deleteRecurringTransaction,
  getAllRecurringTransactions,
  processRecurringTransactions,
  updateRecurringTransaction,
} from "../controllers/recurringTransactionController.js";

const recurringTransactionRouter = express.Router();

recurringTransactionRouter.post("/add", authMiddleware, addRecurringTransaction);
recurringTransactionRouter.get("/get", authMiddleware, getAllRecurringTransactions);
recurringTransactionRouter.put(
  "/update/:id",
  authMiddleware,
  updateRecurringTransaction
);
recurringTransactionRouter.delete(
  "/delete/:id",
  authMiddleware,
  deleteRecurringTransaction
);
recurringTransactionRouter.post(
  "/process",
  authMiddleware,
  processRecurringTransactions
);

export default recurringTransactionRouter;
