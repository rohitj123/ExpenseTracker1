import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  CalendarClock,
  CreditCard,
  Pencil,
  Plus,
  Repeat2,
  Trash2,
} from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const BILLING_CYCLES = ["Monthly", "Quarterly", "Yearly"];
const STATUSES = ["Active", "Paused", "Cancelled"];

const initialForm = {
  name: "",
  amount: "",
  billingCycle: "Monthly",
  renewalDate: "",
  category: "Subscription",
  status: "Active",
};

const examples = [
  { name: "Netflix", amount: "649", category: "Entertainment" },
  { name: "Spotify", amount: "119", category: "Music" },
  { name: "ChatGPT", amount: "1999", category: "Productivity" },
  { name: "Amazon Prime", amount: "1499", billingCycle: "Yearly", category: "Shopping" },
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

const getSubscriptionErrorMessage = (error, fallback) => {
  if (!localStorage.getItem("token")) {
    return "Please sign in to load and manage subscriptions.";
  }

  if (!error.response) {
    return "Subscription server is not reachable. Start the backend on port 4000 and try again.";
  }

  if (error.response.status === 401) {
    return "Your session has expired. Please sign in again.";
  }

  return error.response?.data?.message || fallback;
};

const SubscriptionManagement = () => {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const authHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchSubscriptions = async () => {
    if (!localStorage.getItem("token")) {
      setItems([]);
      setMessage("Please sign in to load and manage subscriptions.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await axios.get(`${BASE_URL}/subscription/get`, {
        headers: authHeaders(),
      });
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setMessage(
        getSubscriptionErrorMessage(error, "Unable to load subscriptions.")
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSubscriptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = useMemo(() => {
    const activeItems = items.filter((item) => item.status === "Active");
    const monthlyCost = activeItems.reduce(
      (sum, item) => sum + Number(item.monthlyCost || 0),
      0
    );
    const dueSoon = activeItems.filter(
      (item) => item.reminder === "Renewal due" || item.reminder === "Overdue"
    ).length;

    return {
      active: activeItems.length,
      monthlyCost,
      dueSoon,
    };
  }, [items]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const applyExample = (example) => {
    setForm((current) => ({
      ...current,
      billingCycle: "Monthly",
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
        await axios.put(`${BASE_URL}/subscription/update/${editingId}`, payload, {
          headers: authHeaders(),
        });
        setMessage("Subscription updated successfully.");
      } else {
        await axios.post(`${BASE_URL}/subscription/add`, payload, {
          headers: authHeaders(),
        });
        setMessage("Subscription added successfully.");
      }

      resetForm();
      fetchSubscriptions();
    } catch (error) {
      setMessage(
        getSubscriptionErrorMessage(error, "Could not save subscription.")
      );
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setForm({
      name: item.name || "",
      amount: item.amount || "",
      billingCycle: item.billingCycle || "Monthly",
      renewalDate: formatDateInput(item.renewalDate),
      category: item.category || "Subscription",
      status: item.status || "Active",
    });
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${BASE_URL}/subscription/delete/${id}`, {
        headers: authHeaders(),
      });
      setMessage("Subscription deleted.");
      fetchSubscriptions();
    } catch (error) {
      setMessage(
        getSubscriptionErrorMessage(error, "Could not delete subscription.")
      );
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Subscription Management
        </h1>
        <p className="text-sm text-gray-600">
          Track recurring subscriptions, renewal reminders, and monthly cost.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          icon={<Repeat2 size={20} />}
          label="Active Subscriptions"
          value={summary.active}
        />
        <SummaryCard
          icon={<CreditCard size={20} />}
          label="Monthly Cost"
          value={currency.format(summary.monthlyCost)}
        />
        <SummaryCard
          icon={<CalendarClock size={20} />}
          label="Renewal Reminders"
          value={summary.dueSoon}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm"
        >
          <div className="mb-5 flex items-center gap-2">
            <CreditCard className="text-indigo-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">
              {editingId ? "Edit Subscription" : "Add Subscription"}
            </h2>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {examples.map((example) => (
              <button
                key={example.name}
                type="button"
                onClick={() => applyExample(example)}
                className="rounded-full border border-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
              >
                {example.name}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <FormField label="Subscription Name">
              <input
                required
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder="Netflix"
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

            <FormField label="Billing Cycle">
              <select
                required
                name="billingCycle"
                value={form.billingCycle}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                {BILLING_CYCLES.map((cycle) => (
                  <option key={cycle} value={cycle}>
                    {cycle}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Renewal Date">
              <input
                required
                name="renewalDate"
                type="date"
                value={form.renewalDate}
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
                placeholder="Entertainment"
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
              {editingId ? "Update" : "Add Subscription"}
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
              Subscription Tracking
            </h2>
            <p className="text-sm text-gray-500">
              Renewal reminders appear when a subscription is due within 7 days.
            </p>
          </div>

          <div className="space-y-3">
            {loading && (
              <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
                Loading subscriptions...
              </p>
            )}

            {!loading && items.length === 0 && (
              <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
                No subscriptions added yet.
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
                        <CreditCard size={16} />
                      </span>
                      <h3 className="font-semibold text-gray-900">
                        {item.name}
                      </h3>
                      <ReminderBadge status={item.reminder} />
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      {currency.format(Number(item.amount || 0))} billed{" "}
                      {item.billingCycle.toLowerCase()}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Monthly cost: {currency.format(Number(item.monthlyCost || 0))}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Renewal: {formatDisplayDate(item.renewalDate)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                      {item.status}
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(item)}
                        className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"
                        aria-label="Edit subscription"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item._id)}
                        className="rounded-lg border border-red-100 p-2 text-red-600 hover:bg-red-50"
                        aria-label="Delete subscription"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const ReminderBadge = ({ status }) => {
  const classes =
    status === "Overdue"
      ? "bg-red-50 text-red-700"
      : status === "Renewal due"
        ? "bg-amber-50 text-amber-700"
        : status === "Inactive"
          ? "bg-gray-100 text-gray-600"
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

export default SubscriptionManagement;
