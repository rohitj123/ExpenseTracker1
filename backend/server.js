import express from "express";
import cors from "cors";
import "dotenv/config";
import { connectDB } from "./config/db.js";

import dns from "dns";
import userRouter from "./routes/userRoute.js";
import incomeRouter from "./routes/incomeRoute.js";
import expenseRouter from "./routes/expenseRoute.js";
import dashboardRouter from "./routes/dashboardRoute.js";
import budgetRouter from "./routes/budgetRoute.js";
import savingsGoalRouter from "./routes/savingsGoalRoute.js";
import transactionRouter from "./routes/transactionRoute.js";
import accountRouter from "./routes/accountRoute.js";
import recurringTransactionRouter from "./routes/recurringTransactionRoute.js";
import splitExpenseRouter from "./routes/splitExpenseRoute.js";
import receiptRouter from "./routes/receiptRoute.js";
import notificationRouter from "./routes/notificationRoute.js";
import reportRouter from "./routes/reportRoute.js";
import exportRouter from "./routes/exportRoute.js";
import familyFinanceRouter from "./routes/familyFinanceRoute.js";
import subscriptionRouter from "./routes/subscriptionRoute.js";
import advisorRouter from "./routes/advisorRoute.js";
import mongoose from "mongoose";

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const app = express();
const port = process.env.PORT || 4000;
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is required.");
}

// Middlewares
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));

app.options("/{*splat}", cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// Database
connectDB();

// Routes

app.use("/api/user", userRouter);
app.use("/api/income", incomeRouter);
app.use("/api/expense", expenseRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/budget", budgetRouter);
app.use("/api/savings-goal", savingsGoalRouter);
app.use("/api/transaction", transactionRouter);
app.use("/api/account", accountRouter);
app.use("/api/recurring-transaction", recurringTransactionRouter);
app.use("/api/split-expense", splitExpenseRouter);
app.use("/api/receipt", receiptRouter);
app.use("/api/notification", notificationRouter);
app.use("/api/report", reportRouter);
app.use("/api/export", exportRouter);
app.use("/api/family-finance", familyFinanceRouter);
app.use("/api/subscription", subscriptionRouter);
app.use("/api/advisor", advisorRouter);

app.get("/", (req, res) => {
  res.send("API Working");
});

app.get("/healthz", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Start server
app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});
