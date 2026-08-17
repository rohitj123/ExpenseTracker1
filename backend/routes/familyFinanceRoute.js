import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  addFamily,
  addFamilyBudget,
  deleteFamily,
  getFamilies,
  updateFamily,
  updateFamilyBudget,
} from "../controllers/familyFinanceController.js";

const familyFinanceRouter = express.Router();

familyFinanceRouter.post("/add", authMiddleware, addFamily);
familyFinanceRouter.get("/get", authMiddleware, getFamilies);
familyFinanceRouter.put("/update/:id", authMiddleware, updateFamily);
familyFinanceRouter.post("/budget/:id", authMiddleware, addFamilyBudget);
familyFinanceRouter.put(
  "/budget/:id/:budgetId",
  authMiddleware,
  updateFamilyBudget
);
familyFinanceRouter.delete("/delete/:id", authMiddleware, deleteFamily);

export default familyFinanceRouter;
