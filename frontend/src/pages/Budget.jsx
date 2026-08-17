import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  AlertTriangle,
  CalendarClock,
  IndianRupee,
  Pencil,
  PiggyBank,
  Plus,
  Target,
  Trash2,
} from "lucide-react";
import { EXPENSE_CATEGORIES } from "../assets/expenseCategories.js";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const DURATIONS = ["Monthly", "Weekly"];

const initialForm = {
  category: "Food",
  amount: "",
  duration: "Monthly",
};

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const getBudgetErrorMessage = (error, fallback) => {
  if (!localStorage.getItem("token")) {
    return "Please sign in to load and manage budgets.";
  }

  if (!error.response) {
    return "Budget server is not reachable. Start the backend on port 4000 and try again.";
  }

  if (error.response.status === 401) {
    return "Your session has expired. Please sign in again.";
  }

  return error.response?.data?.message || fallback;
};

const Budget = () => {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const authHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchBudgets = async () => {
    if (!localStorage.getItem("token")) {
      setItems([]);
      setMessage("Please sign in to load and manage budgets.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await axios.get(`${BASE_URL}/budget/get`, {
        headers: authHeaders(),
      });
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setMessage(getBudgetErrorMessage(error, "Unable to load budgets."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBudgets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = useMemo(() => {
    const limit = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const spent = items.reduce((sum, item) => sum + Number(item.spent || 0), 0);
    const alerts = items.filter((item) => item.alert !== "On track").length;

    return { limit, spent, alerts };
  }, [items]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
      };

      if (editingId) {
        await axios.put(`${BASE_URL}/budget/update/${editingId}`, payload, {
          headers: authHeaders(),
        });
        setMessage("Budget updated successfully.");
      } else {
        await axios.post(`${BASE_URL}/budget/add`, payload, {
          headers: authHeaders(),
        });
        setMessage("Budget added successfully.");
      }

      resetForm();
      fetchBudgets();
    } catch (error) {
      setMessage(getBudgetErrorMessage(error, "Could not save budget."));
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setForm({
      category: item.category || "Food",
      amount: item.amount || "",
      duration: item.duration || "Monthly",
    });
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${BASE_URL}/budget/delete/${id}`, {
        headers: authHeaders(),
      });
      setMessage("Budget deleted.");
      fetchBudgets();
    } catch (error) {
      setMessage(getBudgetErrorMessage(error, "Could not delete budget."));
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Budget Management</h1>
        <p className="text-sm text-gray-600">
          Set weekly or monthly category limits and compare them with tracked expenses.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          icon={<Target size={20} />}
          label="Total Budget"
          value={currency.format(summary.limit)}
        />
        <SummaryCard
          icon={<IndianRupee size={20} />}
          label="Tracked Spend"
          value={currency.format(summary.spent)}
        />
        <SummaryCard
          icon={<AlertTriangle size={20} />}
          label="Budget Alerts"
          value={summary.alerts}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm"
        >
          <div className="mb-5 flex items-center gap-2">
            <PiggyBank className="text-indigo-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">
              {editingId ? "Edit Budget" : "Set Budget"}
            </h2>
          </div>

          <div className="space-y-4">
            <FormField label="Category">
              <select
                required
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                {EXPENSE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Budget Amount">
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

            <FormField label="Duration">
              <select
                required
                name="duration"
                value={form.duration}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                {DURATIONS.map((duration) => (
                  <option key={duration} value={duration}>
                    {duration}
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

          <div className="mt-5 flex gap-3">
            <button
              type="submit"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <Plus size={18} />
              {editingId ? "Update" : "Set Budget"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-gray-900">
              Category Budgets
            </h2>
            <p className="text-sm text-gray-500">
              Workflow: Set Budget, Track Expenses, Budget Alert
            </p>
          </div>

          <div className="space-y-3">
            {loading && (
              <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
                Loading budgets...
              </p>
            )}

            {!loading && items.length === 0 && (
              <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
                No budgets set yet.
              </p>
            )}

            {items.map((item) => (
              <article
                key={item._id}
                className="rounded-lg border border-gray-100 p-4 hover:border-indigo-200"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-indigo-50 p-2 text-indigo-700">
                        <CalendarClock size={16} />
                      </span>
                      <h3 className="font-semibold text-gray-900">
                        {item.category} Budget
                      </h3>
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                        {item.duration}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      {currency.format(Number(item.spent || 0))} spent of{" "}
                      {currency.format(Number(item.amount || 0))}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                    <AlertBadge status={item.alert} />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(item)}
                        className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"
                        aria-label="Edit budget"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item._id)}
                        className="rounded-lg border border-red-100 p-2 text-red-600 hover:bg-red-50"
                        aria-label="Delete budget"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full ${progressColor(item.alert)}`}
                    style={{ width: `${Math.min(item.percentUsed || 0, 100)}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {item.percentUsed || 0}% used,{" "}
                  {currency.format(Number(item.remaining || 0))} remaining
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const progressColor = (status) => {
  if (status === "Exceeded") return "bg-red-500";
  if (status === "Near limit") return "bg-amber-500";
  return "bg-emerald-500";
};

const AlertBadge = ({ status }) => {
  const classes =
    status === "Exceeded"
      ? "bg-red-50 text-red-700"
      : status === "Near limit"
        ? "bg-amber-50 text-amber-700"
        : "bg-emerald-50 text-emerald-700";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${classes}`}>
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

export default Budget;
