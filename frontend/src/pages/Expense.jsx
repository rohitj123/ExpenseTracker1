import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  ArrowDownToLine,
  CalendarDays,
  IndianRupee,
  Paperclip,
  Pencil,
  Plus,
  Receipt,
  Trash2,
  WalletCards,
} from "lucide-react";
import { EXPENSE_CATEGORIES } from "../assets/expenseCategories.js";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const PAYMENT_METHODS = ["Cash", "UPI", "Credit Card", "Debit Card", "Bank Transfer"];

const initialForm = {
  amount: "",
  category: "Food",
  date: new Date().toISOString().slice(0, 10),
  paymentMethod: "Cash",
  description: "",
  receipt: "",
};

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const Expense = () => {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const authHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchExpenses = async () => {
    setLoading(true);
    setMessage("");

    try {
      const response = await axios.get(`${BASE_URL}/expense/get`, {
        headers: authHeaders(),
      });
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Unable to load expenses. Please sign in and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredItems = useMemo(() => {
    if (selectedCategory === "All") return items;
    return items.filter((item) => item.category === selectedCategory);
  }, [items, selectedCategory]);

  const summary = useMemo(() => {
    const total = filteredItems.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );
    const highest = filteredItems.reduce(
      (max, item) => Math.max(max, Number(item.amount || 0)),
      0
    );

    return {
      total,
      count: filteredItems.length,
      highest,
    };
  }, [filteredItems]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleReceiptChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setForm((current) => ({ ...current, receipt: reader.result }));
    };
    reader.readAsDataURL(file);
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
        await axios.put(`${BASE_URL}/expense/update/${editingId}`, payload, {
          headers: authHeaders(),
        });
        setMessage("Expense updated successfully.");
      } else {
        await axios.post(`${BASE_URL}/expense/add`, payload, {
          headers: authHeaders(),
        });
        setMessage("Expense added successfully.");
      }

      resetForm();
      fetchExpenses();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not save expense.");
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setForm({
      amount: item.amount || "",
      category: item.category || "Food",
      date: item.date ? new Date(item.date).toISOString().slice(0, 10) : "",
      paymentMethod: item.paymentMethod || "Cash",
      description: item.description || "",
      receipt: item.receipt || "",
    });
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${BASE_URL}/expense/delete/${id}`, {
        headers: authHeaders(),
      });
      setMessage("Expense deleted.");
      fetchExpenses();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not delete expense.");
    }
  };

  const handleDownload = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/expense/downloadexcel`, {
        headers: authHeaders(),
        responseType: "blob",
      });
      const fileUrl = URL.createObjectURL(response.data);
      const link = document.createElement("a");

      link.href = fileUrl;
      link.download = "expense_details.xlsx";
      link.click();
      URL.revokeObjectURL(fileUrl);
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not export expenses.");
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expense Management</h1>
          <p className="text-sm text-gray-600">
            Track spending by amount, category, date, payment method, and receipt.
          </p>
        </div>
        <button
          type="button"
          onClick={handleDownload}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          <ArrowDownToLine size={18} />
          Export
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          icon={<IndianRupee size={20} />}
          label="Total Spent"
          value={currency.format(summary.total)}
        />
        <SummaryCard
          icon={<Receipt size={20} />}
          label="Expense Entries"
          value={summary.count}
        />
        <SummaryCard
          icon={<WalletCards size={20} />}
          label="Highest Expense"
          value={currency.format(summary.highest)}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm"
        >
          <div className="mb-5 flex items-center gap-2">
            <Plus className="text-rose-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">
              {editingId ? "Edit Expense" : "Add Expense"}
            </h2>
          </div>

          <div className="space-y-4">
            <FormField label="Amount">
              <input
                required
                min="1"
                name="amount"
                type="number"
                value={form.amount}
                onChange={handleChange}
                placeholder="450"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
              />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Category">
                <select
                  required
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                >
                  {EXPENSE_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Date">
                <input
                  required
                  name="date"
                  type="date"
                  value={form.date}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                />
              </FormField>
            </div>

            <FormField label="Payment Method">
              <select
                required
                name="paymentMethod"
                value={form.paymentMethod}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Description">
              <textarea
                required
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Restaurant Dinner"
                rows={3}
                className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
              />
            </FormField>

            <FormField label="Receipt">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleReceiptChange}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-rose-50 file:px-3 file:py-1 file:text-rose-700"
              />
              {form.receipt && (
                <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-rose-700">
                  <Paperclip size={14} />
                  Receipt attached
                </p>
              )}
            </FormField>
          </div>

          {message && (
            <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {message}
            </p>
          )}

          <div className="mt-5 flex gap-3">
            <button
              type="submit"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
            >
              <Plus size={18} />
              {editingId ? "Update" : "Add"}
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
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Expense Records
              </h2>
              <p className="text-sm text-gray-500">
                Example: Food, {currency.format(450)}, Restaurant Dinner
              </p>
            </div>
            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
            >
              <option value="All">All Categories</option>
              {EXPENSE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            {loading && (
              <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
                Loading expense records...
              </p>
            )}

            {!loading && filteredItems.length === 0 && (
              <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
                No expense records yet.
              </p>
            )}

            {filteredItems.map((item) => (
              <article
                key={item._id}
                className="grid gap-3 rounded-lg border border-gray-100 p-4 hover:border-rose-200 sm:grid-cols-[1fr_auto]"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-rose-50 p-2 text-rose-700">
                      <Receipt size={16} />
                    </span>
                    <h3 className="font-semibold text-gray-900">
                      {item.description}
                    </h3>
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                      {item.category}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays size={14} />
                      {item.date
                        ? new Date(item.date).toLocaleDateString("en-IN")
                        : "No date"}
                    </span>
                    <span>{item.paymentMethod || "Cash"}</span>
                    {item.receipt && (
                      <a
                        href={item.receipt}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-rose-700"
                      >
                        <Paperclip size={14} />
                        Receipt
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                  <p className="text-lg font-bold text-rose-700">
                    {currency.format(Number(item.amount || 0))}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(item)}
                      className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"
                      aria-label="Edit expense"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item._id)}
                      className="rounded-lg border border-red-100 p-2 text-red-600 hover:bg-red-50"
                      aria-label="Delete expense"
                    >
                      <Trash2 size={16} />
                    </button>
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

const SummaryCard = ({ icon, label, value }) => (
  <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
    <div className="mb-4 inline-flex rounded-lg bg-rose-50 p-2 text-rose-700">
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

export default Expense;
