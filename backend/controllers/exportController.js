import XLSX from "xlsx";
import budgetModel from "../models/budgetModel.js";
import expenseModel from "../models/expenseModel.js";
import incomeModel from "../models/incomeModel.js";

const escapeCsv = (value) => {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

const toCsv = (rows) => {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.map(escapeCsv).join(","),
    ...rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(",")),
  ];
  return lines.join("\n");
};

const toExcelBuffer = (rows, sheetName) => {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
};

const toPdfHtml = (title, rows) => {
  const headers = rows.length > 0 ? Object.keys(rows[0]) : ["Report"];
  const bodyRows =
    rows.length > 0
      ? rows
      : [{ Report: "No records available for this report." }];

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111827; padding: 24px; }
    h1 { font-size: 24px; margin: 0 0 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
    th { background: #eef2ff; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <table>
    <thead><tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr></thead>
    <tbody>
      ${bodyRows
        .map(
          (row) =>
            `<tr>${headers.map((header) => `<td>${row[header] ?? ""}</td>`).join("")}</tr>`
        )
        .join("")}
    </tbody>
  </table>
</body>
</html>`;
};

const sendReport = (res, rows, reportName, format) => {
  if (format === "csv") {
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=${reportName}.csv`);
    return res.send(toCsv(rows));
  }

  if (format === "pdf") {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${reportName}.pdf`);
    return res.send(toPdfHtml(reportName, rows));
  }

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", `attachment; filename=${reportName}.xlsx`);
  return res.send(toExcelBuffer(rows, reportName.slice(0, 31)));
};

const getExpenseRows = async (userId) => {
  const expenses = await expenseModel.find({ userId }).sort({ date: -1 }).lean();
  return expenses.map((expense) => ({
    Description: expense.description,
    Amount: expense.amount,
    Category: expense.category,
    "Payment Method": expense.paymentMethod,
    Date: new Date(expense.date).toLocaleDateString("en-IN"),
  }));
};

const getBudgetRows = async (userId) => {
  const budgets = await budgetModel.find({ userId }).sort({ createdAt: -1 }).lean();
  return budgets.map((budget) => ({
    Category: budget.category,
    Amount: budget.amount,
    Duration: budget.duration,
    Created: new Date(budget.createdAt).toLocaleDateString("en-IN"),
  }));
};

const getAnnualRows = async (userId) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const [income, expenses] = await Promise.all([
    incomeModel.find({ userId, date: { $gte: start, $lte: now } }).lean(),
    expenseModel.find({ userId, date: { $gte: start, $lte: now } }).lean(),
  ]);

  const totalIncome = income.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalExpense = expenses.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  return [
    {
      Year: now.getFullYear(),
      "Total Income": totalIncome,
      "Total Expense": totalExpense,
      Savings: totalIncome - totalExpense,
      "Savings Rate":
        totalIncome > 0 ? `${Math.round(((totalIncome - totalExpense) / totalIncome) * 100)}%` : "0%",
    },
  ];
};

export async function downloadGeneratedReport(req, res) {
  const userId = req.user._id;
  const { reportType = "expense", format = "excel" } = req.query;

  try {
    let rows;
    let reportName;

    if (reportType === "budget") {
      rows = await getBudgetRows(userId);
      reportName = "budget_report";
    } else if (reportType === "annual") {
      rows = await getAnnualRows(userId);
      reportName = "annual_summary";
    } else {
      rows = await getExpenseRows(userId);
      reportName = "expense_report";
    }

    return sendReport(res, rows, reportName, format);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}
