import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  ArrowDownToLine,
  BriefcaseBusiness,
  CalendarDays,
  CircleDollarSign,
  IndianRupee,
  Pencil,
  Plus,
  Trash2,
  WalletCards,
} from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const INCOME_CATEGORIES = [
  "Salary",
  "Freelancing",
  "Business",
  "Investments",
  "Rental Income",
  "Other",
];

const initialForm = {
  source: "",
  amount: "",
  date: new Date().toISOString().slice(0, 10),
  category: "Salary",
  description: "",
};

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const Income = () => {
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

  const fetchIncome = async () => {
    setLoading(true);
    setMessage("");

    try {
      const response = await axios.get(`${BASE_URL}/income/get`, {
        headers: authHeaders(),
      });
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Unable to load income. Please sign in and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncome();
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
        await axios.put(`${BASE_URL}/income/update/${editingId}`, payload, {
          headers: authHeaders(),
        });
        setMessage("Income updated successfully.");
      } else {
        await axios.post(`${BASE_URL}/income/add`, payload, {
          headers: authHeaders(),
        });
        setMessage("Income added successfully.");
      }

      resetForm();
      fetchIncome();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not save income.");
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setForm({
      source: item.source || item.category || "",
      amount: item.amount || "",
      date: item.date ? new Date(item.date).toISOString().slice(0, 10) : "",
      category: item.category || "Salary",
      description: item.description || "",
    });
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${BASE_URL}/income/delete/${id}`, {
        headers: authHeaders(),
      });
      setMessage("Income deleted.");
      fetchIncome();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not delete income.");
    }
  };

  const handleDownload = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/income/downloadexcel`, {
        headers: authHeaders(),
        responseType: "blob",
      });
      const fileUrl = URL.createObjectURL(response.data);
      const link = document.createElement("a");

      link.href = fileUrl;
      link.download = "income_details.xlsx";
      link.click();
      URL.revokeObjectURL(fileUrl);
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not export income.");
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Income Sources</h1>
          <p className="text-sm text-gray-600">
            Track where money comes from, when it arrived, and how it is grouped.
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
          label="Total Income"
          value={currency.format(summary.total)}
        />
        <SummaryCard
          icon={<WalletCards size={20} />}
          label="Income Entries"
          value={summary.count}
        />
        <SummaryCard
          icon={<CircleDollarSign size={20} />}
          label="Highest Source"
          value={currency.format(summary.highest)}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm"
        >
          <div className="mb-5 flex items-center gap-2">
            <Plus className="text-emerald-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">
              {editingId ? "Edit Income" : "Add Income"}
            </h2>
          </div>

          <div className="space-y-4">
            <FormField label="Source">
              <input
                required
                name="source"
                value={form.source}
                onChange={handleChange}
                placeholder="Salary"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
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
                placeholder="50000"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Date">
                <input
                  required
                  name="date"
                  type="date"
                  value={form.date}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </FormField>

              <FormField label="Category">
                <select
                  required
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >
                  {INCOME_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <FormField label="Description">
              <textarea
                required
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Monthly salary credited"
                rows={3}
                className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </FormField>
          </div>

          {message && (
            <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {message}
            </p>
          )}

          <div className="mt-5 flex gap-3">
            <button
              type="submit"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
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
                Income Records
              </h2>
              <p className="text-sm text-gray-500">
                Example: Salary, ₹50,000
              </p>
            </div>
            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="All">All Categories</option>
              {INCOME_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            {loading && (
              <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
                Loading income records...
              </p>
            )}

            {!loading && filteredItems.length === 0 && (
              <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
                No income records yet.
              </p>
            )}

            {filteredItems.map((item) => (
              <article
                key={item._id}
                className="grid gap-3 rounded-lg border border-gray-100 p-4 hover:border-emerald-200 sm:grid-cols-[1fr_auto]"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-emerald-50 p-2 text-emerald-700">
                      <BriefcaseBusiness size={16} />
                    </span>
                    <h3 className="font-semibold text-gray-900">
                      {item.source || item.category}
                    </h3>
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                      {item.category}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    {item.description}
                  </p>
                  <p className="mt-2 inline-flex items-center gap-1 text-xs text-gray-500">
                    <CalendarDays size={14} />
                    {item.date
                      ? new Date(item.date).toLocaleDateString("en-IN")
                      : "No date"}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                  <p className="text-lg font-bold text-emerald-700">
                    {currency.format(Number(item.amount || 0))}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(item)}
                      className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"
                      aria-label="Edit income"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item._id)}
                      className="rounded-lg border border-red-100 p-2 text-red-600 hover:bg-red-50"
                      aria-label="Delete income"
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
    <div className="mb-4 inline-flex rounded-lg bg-emerald-50 p-2 text-emerald-700">
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

export default Income;
