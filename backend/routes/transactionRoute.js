import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  addTransfer,
  downloadTransactionsExcel,
  getAllTransactions,
} from "../controllers/transactionController.js";

const transactionRouter = express.Router();

transactionRouter.post("/transfer/add", authMiddleware, addTransfer);
transactionRouter.get("/get", authMiddleware, getAllTransactions);
transactionRouter.get("/download", authMiddleware, downloadTransactionsExcel);

export default transactionRouter;
