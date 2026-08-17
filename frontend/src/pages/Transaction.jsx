import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  ArrowDown,
  ArrowRightLeft,
  ArrowUp,
  Download,
  IndianRupee,
  Plus,
  Search,
} from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const TYPES = ["All", "Income", "Expense", "Transfer"];
const STATUSES = ["Completed", "Pending", "Failed"];

const initialTransferForm = {
  description: "",
  amount: "",
  date: "",
  status: "Completed",
};

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const formatDisplayDate = (value) => {
  if (!value) return "No date";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};

const getTransactionErrorMessage = (error, fallback) => {
  if (!localStorage.getItem("token")) {
    return "Please sign in to load and manage transactions.";
  }

  if (!error.response) {
    return "Transaction server is not reachable. Start the backend on port 4000 and try again.";
  }

  if (error.response.status === 401) {
    return "Your session has expired. Please sign in again.";
  }

  return error.response?.data?.message || fallback;
};

const Transaction = () => {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("All");
  const [form, setForm] = useState(initialTransferForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const authHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchTransactions = async () => {
    if (!localStorage.getItem("token")) {
      setItems([]);
      setMessage("Please sign in to load and manage transactions.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await axios.get(`${BASE_URL}/transaction/get`, {
        headers: authHeaders(),
        params: { search, type },
      });
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setMessage(
        getTransactionErrorMessage(error, "Unable to load transactions.")
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(fetchTransactions, 250);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, type]);

  const summary = useMemo(() => {
    const income = items
      .filter((item) => item.type === "Income")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const expense = items
      .filter((item) => item.type === "Expense")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const transfers = items.filter((item) => item.type === "Transfer").length;

    return { income, expense, transfers };
  }, [items]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleTransferSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    try {
      await axios.post(
        `${BASE_URL}/transaction/transfer/add`,
        {
          ...form,
          amount: Number(form.amount),
        },
        { headers: authHeaders() }
      );
      setForm(initialTransferForm);
      setMessage("Transfer transaction added successfully.");
      fetchTransactions();
    } catch (error) {
      setMessage(
        getTransactionErrorMessage(error, "Could not save transfer transaction.")
      );
    }
  };

  const handleExport = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/transaction/download`, {
        headers: authHeaders(),
        params: { search, type },
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "transaction_history.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setMessage("Transaction export downloaded.");
    } catch (error) {
      setMessage(
        getTransactionErrorMessage(error, "Could not export transactions.")
      );
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Transaction Management
        </h1>
        <p className="text-sm text-gray-600">
          Maintain income, expense, and transfer records in one searchable history.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          icon={<ArrowUp size={20} />}
          label="Income Records"
          value={currency.format(summary.income)}
        />
        <SummaryCard
          icon={<ArrowDown size={20} />}
          label="Expense Records"
          value={currency.format(summary.expense)}
        />
        <SummaryCard
          icon={<ArrowRightLeft size={20} />}
          label="Transfers"
          value={summary.transfers}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <form
          onSubmit={handleTransferSubmit}
          className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm"
        >
          <div className="mb-5 flex items-center gap-2">
            <ArrowRightLeft className="text-indigo-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">
              Add Transfer
            </h2>
          </div>

          <div className="space-y-4">
            <FormField label="Description">
              <input
                required
                name="description"
                type="text"
                value={form.description}
                onChange={handleChange}
                placeholder="Wallet to bank"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </FormField>

            <FormField label="Amount">
              <input
                required
                min="1"
                name="amount"
                type="number"
                value={form.amount}
                onChange={handleChange}
                placeholder="5000"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </FormField>

            <FormField label="Date">
              <input
                required
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </FormField>

            <FormField label="Status">
              <select
                required
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          {message && (
            <p className="mt-4 rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-800">
              {message}
            </p>
          )}

          <button
            type="submit"
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <Plus size={18} />
            Add Transfer
          </button>
        </form>

        <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Transaction History
              </h2>
              <p className="text-sm text-gray-500">
                Search records and export the filtered transaction list.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <Download size={16} />
              Export
            </button>
          </div>

          <div className="mb-5 grid gap-3 md:grid-cols-[1fr_180px]">
            <label className="relative block">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={17}
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by ID, type, status, category"
                className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </label>

            <select
              value={type}
              onChange={(event) => setType(event.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              {TYPES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-100">
            <div className="grid grid-cols-[1.3fr_0.9fr_0.9fr_0.9fr] bg-gray-50 px-4 py-3 text-xs font-semibold uppercase text-gray-500">
              <span>Transaction</span>
              <span>Amount</span>
              <span>Type</span>
              <span>Status</span>
            </div>

            {loading && (
              <p className="p-4 text-sm text-gray-500">Loading transactions...</p>
            )}

            {!loading && items.length === 0 && (
              <p className="p-4 text-sm text-gray-500">
                No transactions found.
              </p>
            )}

            {!loading &&
              items.map((item) => (
                <article
                  key={item.transactionId}
                  className="grid grid-cols-[1.3fr_0.9fr_0.9fr_0.9fr] items-center gap-3 border-t border-gray-100 px-4 py-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-900">
                      {item.description}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      ID: {item.transactionId}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDisplayDate(item.date)}
                    </p>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {currency.format(Number(item.amount || 0))}
                  </span>
                  <TypeBadge type={item.type} />
                  <StatusBadge status={item.status} />
                </article>
              ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const TypeBadge = ({ type }) => {
  const classes =
    type === "Income"
      ? "bg-emerald-50 text-emerald-700"
      : type === "Expense"
        ? "bg-red-50 text-red-700"
        : "bg-indigo-50 text-indigo-700";

  return (
    <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${classes}`}>
      {type}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const classes =
    status === "Completed"
      ? "bg-emerald-50 text-emerald-700"
      : status === "Failed"
        ? "bg-red-50 text-red-700"
        : "bg-amber-50 text-amber-700";

  return (
    <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${classes}`}>
      {status}
    </span>
  );
};

const SummaryCard = ({ icon, label, value }) => (
  <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
    <div className="mb-4 inline-flex rounded-lg bg-indigo-50 p-2 text-indigo-700">
      {icon}
    </div>
    <p className="text-sm font-medium text-gray-500">{label}</p>
    <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
  </div>
);

const FormField = ({ label, children }) => (
  <label className="block">
    <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
    {children}
  </label>
);

export default Transaction;
