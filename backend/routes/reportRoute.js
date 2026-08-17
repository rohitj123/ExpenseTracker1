import express from "express";
import authMiddleware from "../middleware/auth.js";
import { getReports } from "../controllers/reportController.js";

const reportRouter = express.Router();

reportRouter.get("/get", authMiddleware, getReports);

export default reportRouter;
