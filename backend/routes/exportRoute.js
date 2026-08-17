import express from "express";
import authMiddleware from "../middleware/auth.js";
import { downloadGeneratedReport } from "../controllers/exportController.js";

const exportRouter = express.Router();

exportRouter.get("/download", authMiddleware, downloadGeneratedReport);

export default exportRouter;
