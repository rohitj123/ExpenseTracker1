import express from "express";
import authMiddleware from "../middleware/auth.js";
import { getNotifications } from "../controllers/notificationController.js";

const notificationRouter = express.Router();

notificationRouter.get("/get", authMiddleware, getNotifications);

export default notificationRouter;
