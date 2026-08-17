import React, { useState } from "react";
import axios from "axios";
import {
  Download,
  FileSpreadsheet,
  FileText,
  FolderDown,
  ReceiptText,
  WalletCards,
} from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const REPORTS = [
  {
    label: "Expense Report",
    value: "expense",
    description: "Download expense records with category, payment method, and date.",
    icon: <ReceiptText size={20} />,
  },
  {
    label: "Budget Report",
    value: "budget",
    description: "Download budget limits, duration, and created dates.",
    icon: <WalletCards size={20} />,
  },
  {
    label: "Annual Summary",
    value: "annual",
    description: "Download yearly income, expense, savings, and savings rate.",
    icon: <FileText size={20} />,
  },
];

const FORMATS = [
  { label: "PDF", value: "pdf", icon: <FileText size={16} /> },
  { label: "Excel", value: "excel", icon: <FileSpreadsheet size={16} /> },
  { label: "CSV", value: "csv", icon: <FileText size={16} /> },
];

const getExportErrorMessage = (error, fallback) => {
  if (!localStorage.getItem("token")) {
    return "Please sign in to export and download reports.";
  }

  if (!error.response) {
    return "Export server is not reachable. Start the backend on port 4000 and try again.";
  }

  if (error.response.status === 401) {
    return "Your session has expired. Please sign in again.";
  }

  return error.response?.data?.message || fallback;
};

const ExportDownload = () => {
  const [selectedReport, setSelectedReport] = useState("expense");
  const [message, setMessage] = useState("");

  const authHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const handleDownload = async (format) => {
    setMessage("");

    try {
      const response = await axios.get(`${BASE_URL}/export/download`, {
        headers: authHeaders(),
        params: { reportType: selectedReport, format },
        responseType: "blob",
      });
      const report = REPORTS.find((item) => item.value === selectedReport);
      const extension = format === "excel" ? "xlsx" : format;
      const fileName = `${report.value}_report.${extension}`;
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");

      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
      setMessage(`${report.label} downloaded as ${format.toUpperCase()}.`);
    } catch (error) {
      setMessage(getExportErrorMessage(error, "Could not download report."));
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Export & Download System
        </h1>
        <p className="text-sm text-gray-600">
          Generate reports in PDF, Excel, and CSV formats.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {FORMATS.map((format) => (
          <div
            key={format.value}
            className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm"
          >
            <div className="mb-4 inline-flex rounded-lg bg-indigo-50 p-2 text-indigo-700">
              {format.icon}
            </div>
            <p className="text-sm font-medium text-gray-500">Export Format</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {format.label}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <FolderDown className="text-indigo-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">
              Generated Reports
            </h2>
          </div>

          <div className="space-y-3">
            {REPORTS.map((report) => (
              <button
                key={report.value}
                type="button"
                onClick={() => setSelectedReport(report.value)}
                className={`w-full rounded-lg border p-4 text-left ${
                  selectedReport === report.value
                    ? "border-indigo-200 bg-indigo-50"
                    : "border-gray-100 bg-white hover:border-indigo-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="rounded-md bg-white p-2 text-indigo-700">
                    {report.icon}
                  </span>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {report.label}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {report.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {message && (
            <p className="mt-4 rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-800">
              {message}
            </p>
          )}
        </div>

        <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-gray-900">
              Download Report
            </h2>
            <p className="text-sm text-gray-500">
              Choose a format to generate the selected report.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {FORMATS.map((format) => (
              <button
                key={format.value}
                type="button"
                onClick={() => handleDownload(format.value)}
                className="rounded-lg border border-gray-100 p-5 text-left hover:border-indigo-200 hover:bg-indigo-50"
              >
                <span className="mb-4 inline-flex rounded-lg bg-indigo-50 p-2 text-indigo-700">
                  {format.icon}
                </span>
                <p className="text-sm font-medium text-gray-500">
                  Download as
                </p>
                <p className="mt-1 text-xl font-bold text-gray-900">
                  {format.label}
                </p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-indigo-700">
                  <Download size={16} />
                  Download
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExportDownload;
