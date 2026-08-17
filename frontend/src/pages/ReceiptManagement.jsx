import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Download,
  FileImage,
  FileText,
  IndianRupee,
  Paperclip,
  Plus,
  Receipt,
  Trash2,
  Upload,
} from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const SUPPORTED_TYPES = ["image/jpeg", "image/png", "application/pdf"];

const initialForm = {
  title: "",
  expenseName: "",
  amount: "",
  fileName: "",
  fileData: "",
};

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const getReceiptErrorMessage = (error, fallback) => {
  if (!localStorage.getItem("token")) {
    return "Please sign in to load and manage receipts.";
  }

  if (!error.response) {
    return "Receipt server is not reachable. Start the backend on port 4000 and try again.";
  }

  if (error.response.status === 401) {
    return "Your session has expired. Please sign in again.";
  }

  return error.response?.data?.message || fallback;
};

const ReceiptManagement = () => {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const authHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchReceipts = async () => {
    if (!localStorage.getItem("token")) {
      setItems([]);
      setMessage("Please sign in to load and manage receipts.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await axios.get(`${BASE_URL}/receipt/get`, {
        headers: authHeaders(),
      });
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setMessage(getReceiptErrorMessage(error, "Unable to load receipts."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchReceipts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = useMemo(() => {
    const totalProofs = items.length;
    const totalAmount = items.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );
    const pdfCount = items.filter(
      (item) => item.mimeType === "application/pdf"
    ).length;

    return { totalProofs, totalAmount, pdfCount };
  }, [items]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!SUPPORTED_TYPES.includes(file.type)) {
      setForm((current) => ({ ...current, fileName: "", fileData: "" }));
      setMessage("Only JPG, PNG, and PDF receipts are supported.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setForm((current) => ({
        ...current,
        fileName: file.name,
        fileData: reader.result,
      }));
      setMessage("");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    try {
      await axios.post(
        `${BASE_URL}/receipt/add`,
        {
          ...form,
          amount: Number(form.amount),
        },
        { headers: authHeaders() }
      );
      setForm(initialForm);
      setMessage("Receipt uploaded successfully.");
      fetchReceipts();
    } catch (error) {
      setMessage(getReceiptErrorMessage(error, "Could not upload receipt."));
    }
  };

  const handleDownload = async (item) => {
    try {
      const response = await axios.get(`${BASE_URL}/receipt/download/${item._id}`, {
        headers: authHeaders(),
        responseType: "blob",
      });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");

      link.href = url;
      link.download = item.fileName || "receipt";
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setMessage(getReceiptErrorMessage(error, "Could not download receipt."));
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${BASE_URL}/receipt/delete/${id}`, {
        headers: authHeaders(),
      });
      setMessage("Receipt deleted.");
      fetchReceipts();
    } catch (error) {
      setMessage(getReceiptErrorMessage(error, "Could not delete receipt."));
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Receipt Management
        </h1>
        <p className="text-sm text-gray-600">
          Store expense proofs with JPG, PNG, and PDF receipt downloads.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          icon={<Receipt size={20} />}
          label="Stored Receipts"
          value={summary.totalProofs}
        />
        <SummaryCard
          icon={<IndianRupee size={20} />}
          label="Proof Amount"
          value={currency.format(summary.totalAmount)}
        />
        <SummaryCard
          icon={<FileText size={20} />}
          label="PDF Receipts"
          value={summary.pdfCount}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm"
        >
          <div className="mb-5 flex items-center gap-2">
            <Upload className="text-indigo-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">
              Receipt Upload
            </h2>
          </div>

          <div className="space-y-4">
            <FormField label="Receipt Title">
              <input
                required
                name="title"
                type="text"
                value={form.title}
                onChange={handleChange}
                placeholder="Dinner receipt"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </FormField>

            <FormField label="Expense Name">
              <input
                required
                name="expenseName"
                type="text"
                value={form.expenseName}
                onChange={handleChange}
                placeholder="Restaurant Dinner"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </FormField>

            <FormField label="Amount">
              <input
                required
                min="0"
                name="amount"
                type="number"
                value={form.amount}
                onChange={handleChange}
                placeholder="1200"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </FormField>

            <FormField label="Receipt File">
              <input
                required
                type="file"
                accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                onChange={handleFileChange}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-1 file:text-indigo-700"
              />
              {form.fileName && (
                <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-indigo-700">
                  <Paperclip size={14} />
                  {form.fileName}
                </p>
              )}
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
            Upload Receipt
          </button>
        </form>

        <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-gray-900">
              Image Storage
            </h2>
            <p className="text-sm text-gray-500">
              Receipt proofs can be downloaded whenever needed.
            </p>
          </div>

          <div className="space-y-3">
            {loading && (
              <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
                Loading receipts...
              </p>
            )}

            {!loading && items.length === 0 && (
              <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
                No receipts uploaded yet.
              </p>
            )}

            {items.map((item) => (
              <article
                key={item._id}
                className="grid gap-3 rounded-lg border border-gray-100 p-4 hover:border-indigo-200 sm:grid-cols-[1fr_auto]"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-indigo-50 p-2 text-indigo-700">
                      {item.mimeType === "application/pdf" ? (
                        <FileText size={16} />
                      ) : (
                        <FileImage size={16} />
                      )}
                    </span>
                    <h3 className="font-semibold text-gray-900">{item.title}</h3>
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                      {formatType(item.mimeType)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    {item.expenseName} - {currency.format(Number(item.amount || 0))}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">{item.fileName}</p>
                </div>

                <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                  <button
                    type="button"
                    onClick={() => handleDownload(item)}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Download size={16} />
                    Download
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item._id)}
                    className="rounded-lg border border-red-100 p-2 text-red-600 hover:bg-red-50"
                    aria-label="Delete receipt"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const formatType = (mimeType) => {
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType === "image/png") return "PNG";
  return "JPG";
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

export default ReceiptManagement;
