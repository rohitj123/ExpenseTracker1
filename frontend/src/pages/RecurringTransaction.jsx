import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  Pencil,
  Plus,
  Repeat2,
  Trash2,
  Zap,
} from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const TYPES = ["Income", "Expense", "Transfer"];
const RECURRENCES = ["Daily", "Weekly", "Monthly"];
const STATUSES = ["Active", "Paused"];

const initialForm = {
  title: "",
  amount: "",
  transactionType: "Expense",
  recurrence: "Monthly",
  nextDate: "",
  category: "General",
  status: "Active",
};

const examples = [
  {
    title: "Salary",
    amount: "50000",
    transactionType: "Income",
    recurrence: "Monthly",
    category: "Salary",
  },
  {
    title: "Rent",
    amount: "15000",
    transactionType: "Expense",
    recurrence: "Monthly",
    category: "Housing",
  },
  {
    title: "Netflix Subscription",
    amount: "649",
    transactionType: "Expense",
    recurrence: "Monthly",
    category: "Subscription",
  },
  {
    title: "Electricity Bill",
    amount: "2200",
    transactionType: "Expense",
    recurrence: "Monthly",
    category: "Bills",
  },
  {
    title: "EMI",
    amount: "8500",
    transactionType: "Expense",
    recurrence: "Monthly",
    category: "Loan",
  },
];

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const formatDateInput = (value) => {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
};

const formatDisplayDate = (value) => {
  if (!value) return "No date";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};

const getRecurringErrorMessage = (error, fallback) => {
  if (!localStorage.getItem("token")) {
    return "Please sign in to load and manage recurring transactions.";
  }

  if (!error.response) {
    return "Recurring transaction server is not reachable. Start the backend on port 4000 and try again.";
  }

  if (error.response.status === 401) {
    return "Your session has expired. Please sign in again.";
  }

  return error.response?.data?.message || fallback;
};

const RecurringTransaction = () => {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const authHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchRecurring = async () => {
    if (!localStorage.getItem("token")) {
      setItems([]);
      setMessage("Please sign in to load and manage recurring transactions.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await axios.get(`${BASE_URL}/recurring-transaction/get`, {
        headers: authHeaders(),
      });
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setMessage(
        getRecurringErrorMessage(error, "Unable to load recurring transactions.")
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRecurring();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = useMemo(() => {
    const active = items.filter((item) => item.status === "Active").length;
    const monthlyTotal = items
      .filter((item) => item.recurrence === "Monthly")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const dueToday = items.filter((item) => {
      if (item.status !== "Active" || !item.nextDate) return false;
      const nextDate = new Date(item.nextDate);
      const today = new Date();
      nextDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      return nextDate <= today;
    }).length;

    return { active, monthlyTotal, dueToday };
  }, [items]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const applyExample = (example) => {
    setForm((current) => ({
      ...current,
      ...example,
    }));
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
        await axios.put(
          `${BASE_URL}/recurring-transaction/update/${editingId}`,
          payload,
          { headers: authHeaders() }
        );
        setMessage("Recurring transaction updated successfully.");
      } else {
        await axios.post(`${BASE_URL}/recurring-transaction/add`, payload, {
          headers: authHeaders(),
        });
        setMessage("Recurring transaction added successfully.");
      }

      resetForm();
      fetchRecurring();
    } catch (error) {
      setMessage(
        getRecurringErrorMessage(error, "Could not save recurring transaction.")
      );
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setForm({
      title: item.title || "",
      amount: item.amount || "",
      transactionType: item.transactionType || "Expense",
      recurrence: item.recurrence || "Monthly",
      nextDate: formatDateInput(item.nextDate),
      category: item.category || "General",
      status: item.status || "Active",
    });
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${BASE_URL}/recurring-transaction/delete/${id}`, {
        headers: authHeaders(),
      });
      setMessage("Recurring transaction deleted.");
      fetchRecurring();
    } catch (error) {
      setMessage(
        getRecurringErrorMessage(error, "Could not delete recurring transaction.")
      );
    }
  };

  const handleProcess = async () => {
    try {
      const response = await axios.post(
        `${BASE_URL}/recurring-transaction/process`,
        {},
        { headers: authHeaders() }
      );
      setMessage(response.data?.message || "Automatic transactions processed.");
      fetchRecurring();
    } catch (error) {
      setMessage(
        getRecurringErrorMessage(error, "Could not process automatic transactions.")
      );
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Recurring Transactions
        </h1>
        <p className="text-sm text-gray-600">
          Automate repeated entries like salary, rent, EMI, subscriptions, and bills.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          icon={<Repeat2 size={20} />}
          label="Active Setups"
          value={summary.active}
        />
        <SummaryCard
          icon={<CalendarClock size={20} />}
          label="Monthly Scheduled"
          value={currency.format(summary.monthlyTotal)}
        />
        <SummaryCard
          icon={<Zap size={20} />}
          label="Due Today"
          value={summary.dueToday}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm"
        >
          <div className="mb-5 flex items-center gap-2">
            <Repeat2 className="text-indigo-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">
              {editingId ? "Edit Setup" : "Recurring Setup"}
            </h2>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {examples.map((example) => (
              <button
                key={example.title}
                type="button"
                onClick={() => applyExample(example)}
                className="rounded-full border border-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
              >
                {example.title}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <FormField label="Title">
              <input
                required
                name="title"
                type="text"
                value={form.title}
                onChange={handleChange}
                placeholder="Netflix Subscription"
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
                placeholder="649"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </FormField>

            <FormField label="Type">
              <select
                required
                name="transactionType"
                value={form.transactionType}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                {TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Recurrence">
              <select
                required
                name="recurrence"
                value={form.recurrence}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                {RECURRENCES.map((recurrence) => (
                  <option key={recurrence} value={recurrence}>
                    {recurrence}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Next Date">
              <input
                required
                name="nextDate"
                type="date"
                value={form.nextDate}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </FormField>

            <FormField label="Category">
              <input
                name="category"
                type="text"
                value={form.category}
                onChange={handleChange}
                placeholder="Subscription"
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

          <div className="mt-5 flex gap-3">
            <button
              type="submit"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <Plus size={18} />
              {editingId ? "Update" : "Add Setup"}
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
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Automatic Transactions
              </h2>
              <p className="text-sm text-gray-500">
                Workflow: Recurring Setup, then Automatic Transaction.
              </p>
            </div>
            <button
              type="button"
              onClick={handleProcess}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <Zap size={16} />
              Process Due
            </button>
          </div>

          <div className="space-y-3">
            {loading && (
              <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
                Loading recurring transactions...
              </p>
            )}

            {!loading && items.length === 0 && (
              <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
                No recurring transactions set up yet.
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
                        <Clock3 size={16} />
                      </span>
                      <h3 className="font-semibold text-gray-900">
                        {item.title}
                      </h3>
                      <Badge tone={item.status === "Active" ? "green" : "amber"}>
                        {item.status}
                      </Badge>
                      <Badge tone="indigo">{item.recurrence}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      {currency.format(Number(item.amount || 0))} as{" "}
                      {item.transactionType}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Next automatic date: {formatDisplayDate(item.nextDate)}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(item)}
                      className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"
                      aria-label="Edit recurring transaction"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item._id)}
                      className="rounded-lg border border-red-100 p-2 text-red-600 hover:bg-red-50"
                      aria-label="Delete recurring transaction"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge tone={item.transactionType === "Income" ? "green" : "red"}>
                    {item.transactionType}
                  </Badge>
                  <Badge tone="gray">{item.category || "General"}</Badge>
                  {new Date(item.nextDate) <= new Date() &&
                    item.status === "Active" && (
                      <Badge tone="amber">
                        <CheckCircle2 size={13} />
                        Due
                      </Badge>
                    )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const Badge = ({ children, tone }) => {
  const classes = {
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-700",
    amber: "bg-amber-50 text-amber-700",
    indigo: "bg-indigo-50 text-indigo-700",
    gray: "bg-gray-100 text-gray-600",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${classes[tone]}`}
    >
      {children}
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

export default RecurringTransaction;
