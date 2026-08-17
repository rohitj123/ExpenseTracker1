import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  CheckCircle2,
  Pencil,
  Plus,
  ReceiptText,
  Trash2,
  Users,
  WalletCards,
} from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const initialForm = {
  title: "",
  totalAmount: "",
  paidBy: "",
  date: "",
  participants: "",
};

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

const getSplitErrorMessage = (error, fallback) => {
  if (!localStorage.getItem("token")) {
    return "Please sign in to load and manage split expenses.";
  }

  if (!error.response) {
    return "Split expense server is not reachable. Start the backend on port 4000 and try again.";
  }

  if (error.response.status === 401) {
    return "Your session has expired. Please sign in again.";
  }

  return error.response?.data?.message || fallback;
};

const SplitExpense = () => {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const authHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchSplitExpenses = async () => {
    if (!localStorage.getItem("token")) {
      setItems([]);
      setMessage("Please sign in to load and manage split expenses.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await axios.get(`${BASE_URL}/split-expense/get`, {
        headers: authHeaders(),
      });
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setMessage(getSplitErrorMessage(error, "Unable to load split expenses."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSplitExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = useMemo(() => {
    const totalShared = items.reduce(
      (sum, item) => sum + Number(item.totalAmount || 0),
      0
    );
    const pendingAmount = items.reduce(
      (sum, item) => sum + Number(item.pendingAmount || 0),
      0
    );
    const settledBills = items.filter((item) => item.status === "Settled").length;

    return { totalShared, pendingAmount, settledBills };
  }, [items]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const applyRestaurantExample = () => {
    setForm({
      title: "Restaurant Bill",
      totalAmount: "2000",
      paidBy: "You",
      date: "",
      participants: "Friend 1, Friend 2, Friend 3, Friend 4",
    });
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
        totalAmount: Number(form.totalAmount),
      };

      if (editingId) {
        await axios.put(`${BASE_URL}/split-expense/update/${editingId}`, payload, {
          headers: authHeaders(),
        });
        setMessage("Split expense updated successfully.");
      } else {
        await axios.post(`${BASE_URL}/split-expense/add`, payload, {
          headers: authHeaders(),
        });
        setMessage("Split expense added successfully.");
      }

      resetForm();
      fetchSplitExpenses();
    } catch (error) {
      setMessage(getSplitErrorMessage(error, "Could not save split expense."));
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setForm({
      title: item.title || "",
      totalAmount: item.totalAmount || "",
      paidBy: item.paidBy || "",
      date: formatDateInput(item.date),
      participants: item.participants?.map((person) => person.name).join(", ") || "",
    });
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${BASE_URL}/split-expense/delete/${id}`, {
        headers: authHeaders(),
      });
      setMessage("Split expense deleted.");
      fetchSplitExpenses();
    } catch (error) {
      setMessage(getSplitErrorMessage(error, "Could not delete split expense."));
    }
  };

  const handleSettlement = async (expenseId, participantId, settled) => {
    try {
      await axios.patch(
        `${BASE_URL}/split-expense/settlement/${expenseId}/${participantId}`,
        { settled },
        { headers: authHeaders() }
      );
      fetchSplitExpenses();
    } catch (error) {
      setMessage(getSplitErrorMessage(error, "Could not update settlement."));
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Expense Splitting System
        </h1>
        <p className="text-sm text-gray-600">
          Split bills, manage shared expenses, and track settlements.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          icon={<ReceiptText size={20} />}
          label="Shared Expenses"
          value={currency.format(summary.totalShared)}
        />
        <SummaryCard
          icon={<WalletCards size={20} />}
          label="Pending Settlement"
          value={currency.format(summary.pendingAmount)}
        />
        <SummaryCard
          icon={<CheckCircle2 size={20} />}
          label="Settled Bills"
          value={summary.settledBills}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm"
        >
          <div className="mb-5 flex items-center gap-2">
            <Users className="text-indigo-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">
              {editingId ? "Edit Split Bill" : "Split Bill"}
            </h2>
          </div>

          <button
            type="button"
            onClick={applyRestaurantExample}
            className="mb-4 rounded-full border border-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
          >
            Restaurant Bill: ₹2,000, 4 Friends, ₹500 Each
          </button>

          <div className="space-y-4">
            <FormField label="Bill Name">
              <input
                required
                name="title"
                type="text"
                value={form.title}
                onChange={handleChange}
                placeholder="Restaurant Bill"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </FormField>

            <FormField label="Total Amount">
              <input
                required
                min="1"
                name="totalAmount"
                type="number"
                value={form.totalAmount}
                onChange={handleChange}
                placeholder="2000"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </FormField>

            <FormField label="Paid By">
              <input
                required
                name="paidBy"
                type="text"
                value={form.paidBy}
                onChange={handleChange}
                placeholder="You"
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

            <FormField label="Friends / Participants">
              <textarea
                required
                name="participants"
                value={form.participants}
                onChange={handleChange}
                placeholder="Amit, Riya, John, You"
                rows="3"
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
              {editingId ? "Update" : "Split Bill"}
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
              Shared Expenses
            </h2>
            <p className="text-sm text-gray-500">
              Mark each friend settled as payments come in.
            </p>
          </div>

          <div className="space-y-3">
            {loading && (
              <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
                Loading split expenses...
              </p>
            )}

            {!loading && items.length === 0 && (
              <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
                No split bills added yet.
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
                        <ReceiptText size={16} />
                      </span>
                      <h3 className="font-semibold text-gray-900">{item.title}</h3>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      {currency.format(Number(item.totalAmount || 0))} paid by{" "}
                      {item.paidBy}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {currency.format(Number(item.perPersonAmount || 0))} each,
                      {` ${item.pendingCount || 0}`} pending,{" "}
                      {formatDisplayDate(item.date)}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(item)}
                      className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"
                      aria-label="Edit split expense"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item._id)}
                      className="rounded-lg border border-red-100 p-2 text-red-600 hover:bg-red-50"
                      aria-label="Delete split expense"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-2 md:grid-cols-2">
                  {item.participants.map((person) => (
                    <label
                      key={person._id}
                      className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {person.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {currency.format(Number(person.amountOwed || 0))}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={person.settled}
                        onChange={(event) =>
                          handleSettlement(item._id, person._id, event.target.checked)
                        }
                        className="h-4 w-4 accent-indigo-600"
                        aria-label={`Mark ${person.name} settled`}
                      />
                    </label>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const StatusBadge = ({ status }) => {
  const classes =
    status === "Settled"
      ? "bg-emerald-50 text-emerald-700"
      : "bg-amber-50 text-amber-700";

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

export default SplitExpense;
