import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  addSavingsGoal,
  deleteSavingsGoal,
  getAllSavingsGoals,
  updateSavingsGoal,
} from "../controllers/savingsGoalController.js";

const savingsGoalRouter = express.Router();

savingsGoalRouter.post("/add", authMiddleware, addSavingsGoal);
savingsGoalRouter.get("/get", authMiddleware, getAllSavingsGoals);
savingsGoalRouter.put("/update/:id", authMiddleware, updateSavingsGoal);
savingsGoalRouter.delete("/delete/:id", authMiddleware, deleteSavingsGoal);

export default savingsGoalRouter;
