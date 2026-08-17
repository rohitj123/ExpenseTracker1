import express from "express";
import authMiddleware from "../middleware/auth.js";
import { getAdvisorInsights } from "../controllers/advisorController.js";

const advisorRouter = express.Router();

advisorRouter.get("/get", authMiddleware, getAdvisorInsights);

export default advisorRouter;
