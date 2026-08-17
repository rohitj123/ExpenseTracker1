import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  addSubscription,
  deleteSubscription,
  getAllSubscriptions,
  updateSubscription,
} from "../controllers/subscriptionController.js";

const subscriptionRouter = express.Router();

subscriptionRouter.post("/add", authMiddleware, addSubscription);
subscriptionRouter.get("/get", authMiddleware, getAllSubscriptions);
subscriptionRouter.put("/update/:id", authMiddleware, updateSubscription);
subscriptionRouter.delete("/delete/:id", authMiddleware, deleteSubscription);

export default subscriptionRouter;
