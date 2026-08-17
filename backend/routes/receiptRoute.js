import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  addReceipt,
  deleteReceipt,
  downloadReceipt,
  getAllReceipts,
} from "../controllers/receiptController.js";

const receiptRouter = express.Router();

receiptRouter.post("/add", authMiddleware, addReceipt);
receiptRouter.get("/get", authMiddleware, getAllReceipts);
receiptRouter.get("/download/:id", authMiddleware, downloadReceipt);
receiptRouter.delete("/delete/:id", authMiddleware, deleteReceipt);

export default receiptRouter;
