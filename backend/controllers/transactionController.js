import XLSX from "xlsx";
import incomeModel from "../models/incomeModel.js";
import expenseModel from "../models/expenseModel.js";
import transferModel from "../models/transferModel.js";

const normalizeTransaction = (transaction, type) => {
  const data = transaction.toObject ? transaction.toObject() : transaction;

  return {
    transactionId: data._id,
    amount: data.amount,
    date: data.date,
    type,
    status: data.status || "Completed",
    description: data.description || data.source || `${type} transaction`,
    category: data.category || "Transfer",
  };
};

const matchesSearch = (transaction, search) => {
  if (!search) return true;

  const query = search.toLowerCase();
  return [
    transaction.transactionId?.toString(),
    transaction.description,
    transaction.category,
    transaction.type,
    transaction.status,
  ]
    .filter(Boolean)
    .some((value) => value.toLowerCase().includes(query));
};

const getTransactions = async (userId, search = "", type = "All") => {
  const [income, expenses, transfers] = await Promise.all([
    incomeModel.find({ userId }),
    expenseModel.find({ userId }),
    transferModel.find({ userId }),
  ]);

  return [
    ...income.map((item) => normalizeTransaction(item, "Income")),
    ...expenses.map((item) => normalizeTransaction(item, "Expense")),
    ...transfers.map((item) => normalizeTransaction(item, "Transfer")),
  ]
    .filter((item) => type === "All" || item.type === type)
    .filter((item) => matchesSearch(item, search))
    .sort((a, b) => new Date(b.date) - new Date(a.date));
};

export async function addTransfer(req, res) {
  const userId = req.user._id;
  const { description, amount, date, status } = req.body;

  try {
    if (!description || !amount || !date) {
      return res.status(400).json({
        success: false,
        message: "Description, amount, and date are required",
      });
    }

    const transfer = new transferModel({
      userId,
      description,
      amount,
      date: new Date(date),
      status: status || "Completed",
    });
    await transfer.save();

    res.json({
      success: true,
      message: "Transfer transaction added successfully!",
      data: normalizeTransaction(transfer, "Transfer"),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

export async function getAllTransactions(req, res) {
  try {
    const transactions = await getTransactions(
      req.user._id,
      req.query.search || "",
      req.query.type || "All"
    );

    res.json(transactions);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

export async function downloadTransactionsExcel(req, res) {
  try {
    const transactions = await getTransactions(
      req.user._id,
      req.query.search || "",
      req.query.type || "All"
    );

    const sheetData = transactions.map((transaction) => ({
      "Transaction ID": transaction.transactionId.toString(),
      Amount: transaction.amount,
      Date: new Date(transaction.date).toLocaleDateString(),
      Type: transaction.type,
      Status: transaction.status,
      Description: transaction.description,
    }));

    const worksheet = XLSX.utils.json_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=transaction_history.xlsx"
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.send(buffer);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}
