import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  addBudget,
  deleteBudget,
  getAllBudgets,
  updateBudget,
} from "../controllers/budgetController.js";

const budgetRouter = express.Router();

budgetRouter.post("/add", authMiddleware, addBudget);
budgetRouter.get("/get", authMiddleware, getAllBudgets);
budgetRouter.put("/update/:id", authMiddleware, updateBudget);
budgetRouter.delete("/delete/:id", authMiddleware, deleteBudget);

export default budgetRouter;
