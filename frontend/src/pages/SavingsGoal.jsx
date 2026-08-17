import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  IndianRupee,
  Pencil,
  Plus,
  Target,
  Trash2,
  WalletCards,
} from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const initialForm = {
  goalName: "",
  targetAmount: "",
  currentAmount: "",
  targetDate: "",
};

const examples = [
  { goalName: "New Laptop", targetAmount: "80000" },
  { goalName: "Vacation", targetAmount: "50000" },
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

const getSavingsErrorMessage = (error, fallback) => {
  if (!localStorage.getItem("token")) {
    return "Please sign in to load and manage savings goals.";
  }

  if (!error.response) {
    return "Savings goal server is not reachable. Start the backend on port 4000 and try again.";
  }

  if (error.response.status === 401) {
    return "Your session has expired. Please sign in again.";
  }

  return error.response?.data?.message || fallback;
};

const SavingsGoal = () => {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const authHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchGoals = async () => {
    if (!localStorage.getItem("token")) {
      setItems([]);
      setMessage("Please sign in to load and manage savings goals.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await axios.get(`${BASE_URL}/savings-goal/get`, {
        headers: authHeaders(),
      });
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setMessage(getSavingsErrorMessage(error, "Unable to load savings goals."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchGoals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = useMemo(() => {
    const target = items.reduce(
      (sum, item) => sum + Number(item.targetAmount || 0),
      0
    );
    const saved = items.reduce(
      (sum, item) => sum + Number(item.currentAmount || 0),
      0
    );
    const completed = items.filter((item) => item.alert === "Completed").length;

    return { target, saved, completed };
  }, [items]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const applyExample = (example) => {
    setForm((current) => ({
      ...current,
      goalName: example.goalName,
      targetAmount: example.targetAmount,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    try {
      const payload = {
        ...form,
        targetAmount: Number(form.targetAmount),
        currentAmount: Number(form.currentAmount),
      };

      if (editingId) {
        await axios.put(`${BASE_URL}/savings-goal/update/${editingId}`, payload, {
          headers: authHeaders(),
        });
        setMessage("Savings goal updated successfully.");
      } else {
        await axios.post(`${BASE_URL}/savings-goal/add`, payload, {
          headers: authHeaders(),
        });
        setMessage("Savings goal added successfully.");
      }

      resetForm();
      fetchGoals();
    } catch (error) {
      setMessage(getSavingsErrorMessage(error, "Could not save savings goal."));
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setForm({
      goalName: item.goalName || "",
      targetAmount: item.targetAmount || "",
      currentAmount: item.currentAmount || "",
      targetDate: formatDateInput(item.targetDate),
    });
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${BASE_URL}/savings-goal/delete/${id}`, {
        headers: authHeaders(),
      });
      setMessage("Savings goal deleted.");
      fetchGoals();
    } catch (error) {
      setMessage(getSavingsErrorMessage(error, "Could not delete savings goal."));
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Savings Goal Management
        </h1>
        <p className="text-sm text-gray-600">
          Create goals, track saved amounts, and see completion alerts.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          icon={<Target size={20} />}
          label="Target Amount"
          value={currency.format(summary.target)}
        />
        <SummaryCard
          icon={<IndianRupee size={20} />}
          label="Saved Amount"
          value={currency.format(summary.saved)}
        />
        <SummaryCard
          icon={<CheckCircle2 size={20} />}
          label="Completed Goals"
          value={summary.completed}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm"
        >
          <div className="mb-5 flex items-center gap-2">
            <WalletCards className="text-indigo-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">
              {editingId ? "Edit Goal" : "Add Savings Goal"}
            </h2>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {examples.map((example) => (
              <button
                key={example.goalName}
                type="button"
                onClick={() => applyExample(example)}
                className="rounded-full border border-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
              >
                {example.goalName} {currency.format(Number(example.targetAmount))}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <FormField label="Goal Name">
              <input
                required
                name="goalName"
                type="text"
                value={form.goalName}
                onChange={handleChange}
                placeholder="New Laptop"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </FormField>

            <FormField label="Target Amount">
              <input
                required
                min="1"
                name="targetAmount"
                type="number"
                value={form.targetAmount}
                onChange={handleChange}
                placeholder="80000"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </FormField>

            <FormField label="Current Amount">
              <input
                required
                min="0"
                name="currentAmount"
                type="number"
                value={form.currentAmount}
                onChange={handleChange}
                placeholder="15000"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </FormField>

            <FormField label="Target Date">
              <input
                required
                name="targetDate"
                type="date"
                value={form.targetDate}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
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
              {editingId ? "Update" : "Add Goal"}
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
              Savings Progress
            </h2>
            <p className="text-sm text-gray-500">
              Workflow: Create Goal, Track Savings, Completion Alert
            </p>
          </div>

          <div className="space-y-3">
            {loading && (
              <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
                Loading savings goals...
              </p>
            )}

            {!loading && items.length === 0 && (
              <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
                No savings goals added yet.
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
                        <CalendarDays size={16} />
                      </span>
                      <h3 className="font-semibold text-gray-900">
                        {item.goalName}
                      </h3>
                      <GoalBadge status={item.alert} />
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      {currency.format(Number(item.currentAmount || 0))} saved of{" "}
                      {currency.format(Number(item.targetAmount || 0))}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Target date: {formatDisplayDate(item.targetDate)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                    <span className="text-sm font-semibold text-gray-700">
                      {item.progress || 0}%
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(item)}
                        className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"
                        aria-label="Edit savings goal"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item._id)}
                        className="rounded-lg border border-red-100 p-2 text-red-600 hover:bg-red-50"
                        aria-label="Delete savings goal"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full ${progressColor(item.alert)}`}
                    style={{ width: `${Math.min(item.progress || 0, 100)}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {currency.format(Number(item.remaining || 0))} remaining
                  {item.alert !== "Completed" && item.daysLeft >= 0
                    ? `, ${item.daysLeft} days left`
                    : ""}
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
  if (status === "Completed") return "bg-emerald-500";
  if (status === "Target missed") return "bg-red-500";
  if (status === "Due soon") return "bg-amber-500";
  return "bg-indigo-500";
};

const GoalBadge = ({ status }) => {
  const classes =
    status === "Completed"
      ? "bg-emerald-50 text-emerald-700"
      : status === "Target missed"
        ? "bg-red-50 text-red-700"
        : status === "Due soon"
          ? "bg-amber-50 text-amber-700"
          : "bg-indigo-50 text-indigo-700";

  const Icon = status === "Completed" ? CheckCircle2 : AlertCircle;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${classes}`}
    >
      <Icon size={13} />
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

export default SavingsGoal;
