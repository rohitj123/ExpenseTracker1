import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  addAccount,
  deleteAccount,
  getAllAccounts,
  transferBetweenAccounts,
  updateAccount,
} from "../controllers/accountController.js";

const accountRouter = express.Router();

accountRouter.post("/add", authMiddleware, addAccount);
accountRouter.get("/get", authMiddleware, getAllAccounts);
accountRouter.put("/update/:id", authMiddleware, updateAccount);
accountRouter.delete("/delete/:id", authMiddleware, deleteAccount);
accountRouter.post("/transfer", authMiddleware, transferBetweenAccounts);

export default accountRouter;
