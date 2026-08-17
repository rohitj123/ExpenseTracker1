import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  BarChart3,
  IndianRupee,
  Pencil,
  Plus,
  Trash2,
  Users,
  WalletCards,
} from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const initialFamilyForm = {
  familyName: "",
  sharedWalletBalance: "",
  members: "",
};

const initialBudgetForm = {
  familyId: "",
  category: "",
  amount: "",
  spent: "",
};

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const getFamilyErrorMessage = (error, fallback) => {
  if (!localStorage.getItem("token")) {
    return "Please sign in to load and manage family finance.";
  }

  if (!error.response) {
    return "Family finance server is not reachable. Start the backend on port 4000 and try again.";
  }

  if (error.response.status === 401) {
    return "Your session has expired. Please sign in again.";
  }

  return error.response?.data?.message || fallback;
};

const FamilyFinance = () => {
  const [families, setFamilies] = useState([]);
  const [familyForm, setFamilyForm] = useState(initialFamilyForm);
  const [budgetForm, setBudgetForm] = useState(initialBudgetForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const authHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchFamilies = async () => {
    if (!localStorage.getItem("token")) {
      setFamilies([]);
      setMessage("Please sign in to load and manage family finance.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await axios.get(`${BASE_URL}/family-finance/get`, {
        headers: authHeaders(),
      });
      const data = Array.isArray(response.data) ? response.data : [];
      setFamilies(data);
      setBudgetForm((current) => ({
        ...current,
        familyId: current.familyId || data[0]?._id || "",
      }));
    } catch (error) {
      setMessage(getFamilyErrorMessage(error, "Unable to load family finance."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchFamilies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = useMemo(() => {
    return families.reduce(
      (totals, family) => ({
        wallet: totals.wallet + Number(family.sharedWalletBalance || 0),
        members: totals.members + Number(family.sharedReport?.memberCount || 0),
        budget: totals.budget + Number(family.sharedReport?.totalBudget || 0),
      }),
      { wallet: 0, members: 0, budget: 0 }
    );
  }, [families]);

  const handleFamilyChange = (event) => {
    const { name, value } = event.target;
    setFamilyForm((current) => ({ ...current, [name]: value }));
  };

  const handleBudgetChange = (event) => {
    const { name, value } = event.target;
    setBudgetForm((current) => ({ ...current, [name]: value }));
  };

  const applyExample = () => {
    setBudgetForm((current) => ({
      ...current,
      category: "Family Grocery Budget",
      amount: "12000",
      spent: "4500",
    }));
  };

  const resetFamilyForm = () => {
    setFamilyForm(initialFamilyForm);
    setEditingId(null);
  };

  const handleFamilySubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    try {
      const payload = {
        ...familyForm,
        sharedWalletBalance: Number(familyForm.sharedWalletBalance),
      };

      if (editingId) {
        await axios.put(`${BASE_URL}/family-finance/update/${editingId}`, payload, {
          headers: authHeaders(),
        });
        setMessage("Family finance setup updated successfully.");
      } else {
        await axios.post(`${BASE_URL}/family-finance/add`, payload, {
          headers: authHeaders(),
        });
        setMessage("Family finance setup added successfully.");
      }

      resetFamilyForm();
      fetchFamilies();
    } catch (error) {
      setMessage(getFamilyErrorMessage(error, "Could not save family setup."));
    }
  };

  const handleBudgetSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    try {
      await axios.post(
        `${BASE_URL}/family-finance/budget/${budgetForm.familyId}`,
        {
          category: budgetForm.category,
          amount: Number(budgetForm.amount),
          spent: Number(budgetForm.spent || 0),
        },
        { headers: authHeaders() }
      );
      setBudgetForm((current) => ({
        ...initialBudgetForm,
        familyId: current.familyId,
      }));
      setMessage("Family budget added successfully.");
      fetchFamilies();
    } catch (error) {
      setMessage(getFamilyErrorMessage(error, "Could not save family budget."));
    }
  };

  const handleEdit = (family) => {
    setEditingId(family._id);
    setFamilyForm({
      familyName: family.familyName || "",
      sharedWalletBalance: family.sharedWalletBalance || "",
      members: family.members?.map((member) => member.name).join(", ") || "",
    });
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${BASE_URL}/family-finance/delete/${id}`, {
        headers: authHeaders(),
      });
      setMessage("Family finance setup deleted.");
      fetchFamilies();
    } catch (error) {
      setMessage(getFamilyErrorMessage(error, "Could not delete family setup."));
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Family Finance Management
        </h1>
        <p className="text-sm text-gray-600">
          Manage family expenses with shared wallets, family budgets, and shared reports.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          icon={<WalletCards size={20} />}
          label="Shared Wallet"
          value={currency.format(summary.wallet)}
        />
        <SummaryCard icon={<Users size={20} />} label="Members" value={summary.members} />
        <SummaryCard
          icon={<IndianRupee size={20} />}
          label="Family Budget"
          value={currency.format(summary.budget)}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <div className="space-y-6">
          <form
            onSubmit={handleFamilySubmit}
            className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm"
          >
            <div className="mb-5 flex items-center gap-2">
              <Users className="text-indigo-600" size={20} />
              <h2 className="text-lg font-semibold text-gray-900">
                {editingId ? "Edit Family" : "Shared Wallet Setup"}
              </h2>
            </div>

            <div className="space-y-4">
              <FormField label="Family Name">
                <input
                  required
                  name="familyName"
                  type="text"
                  value={familyForm.familyName}
                  onChange={handleFamilyChange}
                  placeholder="Sharma Family"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </FormField>

              <FormField label="Shared Wallet Balance">
                <input
                  required
                  name="sharedWalletBalance"
                  type="number"
                  value={familyForm.sharedWalletBalance}
                  onChange={handleFamilyChange}
                  placeholder="25000"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </FormField>

              <FormField label="Family Members">
                <textarea
                  name="members"
                  value={familyForm.members}
                  onChange={handleFamilyChange}
                  placeholder="Amit, Priya, Rohan"
                  rows="3"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </FormField>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="submit"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <Plus size={18} />
                {editingId ? "Update" : "Add Family"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetFamilyForm}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <form
            onSubmit={handleBudgetSubmit}
            className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm"
          >
            <div className="mb-5 flex items-center gap-2">
              <IndianRupee className="text-indigo-600" size={20} />
              <h2 className="text-lg font-semibold text-gray-900">
                Family Budget
              </h2>
            </div>

            <button
              type="button"
              onClick={applyExample}
              className="mb-4 rounded-full border border-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
            >
              Family Grocery Budget
            </button>

            <div className="space-y-4">
              <FormField label="Family">
                <select
                  required
                  name="familyId"
                  value={budgetForm.familyId}
                  onChange={handleBudgetChange}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="">Select family</option>
                  {families.map((family) => (
                    <option key={family._id} value={family._id}>
                      {family.familyName}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Budget Name">
                <input
                  required
                  name="category"
                  type="text"
                  value={budgetForm.category}
                  onChange={handleBudgetChange}
                  placeholder="Family Grocery Budget"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </FormField>

              <FormField label="Budget Amount">
                <input
                  required
                  min="1"
                  name="amount"
                  type="number"
                  value={budgetForm.amount}
                  onChange={handleBudgetChange}
                  placeholder="12000"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </FormField>

              <FormField label="Spent Amount">
                <input
                  min="0"
                  name="spent"
                  type="number"
                  value={budgetForm.spent}
                  onChange={handleBudgetChange}
                  placeholder="4500"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </FormField>
            </div>

            {message && (
              <p className="mt-4 rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-800">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={families.length === 0}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              <Plus size={18} />
              Add Family Budget
            </button>
          </form>
        </div>

        <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-gray-900">
              Shared Reports
            </h2>
            <p className="text-sm text-gray-500">
              Family wallet and budget summaries.
            </p>
          </div>

          <div className="space-y-4">
            {loading && (
              <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
                Loading family finance...
              </p>
            )}

            {!loading && families.length === 0 && (
              <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
                No family finance setup added yet.
              </p>
            )}

            {families.map((family) => (
              <article
                key={family._id}
                className="rounded-lg border border-gray-100 p-4 hover:border-indigo-200"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-indigo-50 p-2 text-indigo-700">
                        <Users size={16} />
                      </span>
                      <h3 className="font-semibold text-gray-900">
                        {family.familyName}
                      </h3>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      Shared Wallet:{" "}
                      {currency.format(Number(family.sharedWalletBalance || 0))}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {family.sharedReport?.memberCount || 0} members,
                      {` ${family.sharedReport?.budgetCount || 0}`} budgets
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(family)}
                      className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"
                      aria-label="Edit family finance setup"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(family._id)}
                      className="rounded-lg border border-red-100 p-2 text-red-600 hover:bg-red-50"
                      aria-label="Delete family finance setup"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <ReportMetric
                    label="Budget"
                    value={currency.format(Number(family.sharedReport?.totalBudget || 0))}
                  />
                  <ReportMetric
                    label="Spent"
                    value={currency.format(Number(family.sharedReport?.totalSpent || 0))}
                  />
                  <ReportMetric
                    label="Remaining"
                    value={currency.format(Number(family.sharedReport?.remainingBudget || 0))}
                  />
                </div>

                <div className="mt-4 space-y-3">
                  {family.budgets.map((budget) => (
                    <div key={budget._id}>
                      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                        <span className="font-semibold text-gray-900">
                          {budget.category}
                        </span>
                        <span className="text-gray-600">
                          {currency.format(Number(budget.spent || 0))} /{" "}
                          {currency.format(Number(budget.amount || 0))}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-indigo-500"
                          style={{
                            width: `${Math.min(
                              Math.round(
                                (Number(budget.spent || 0) /
                                  Math.max(Number(budget.amount || 1), 1)) *
                                  100
                              ),
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
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

const SummaryCard = ({ icon, label, value }) => (
  <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
    <div className="mb-4 inline-flex rounded-lg bg-indigo-50 p-2 text-indigo-700">
      {icon}
    </div>
    <p className="text-sm font-medium text-gray-500">{label}</p>
    <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
  </div>
);

const ReportMetric = ({ label, value }) => (
  <div className="rounded-lg bg-gray-50 p-3">
    <div className="mb-2 inline-flex rounded-md bg-white p-2 text-indigo-700">
      <BarChart3 size={16} />
    </div>
    <p className="text-xs font-semibold uppercase text-gray-500">{label}</p>
    <p className="mt-1 text-sm font-bold text-gray-900">{value}</p>
  </div>
);

const FormField = ({ label, children }) => (
  <label className="block">
    <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
    {children}
  </label>
);

export default FamilyFinance;
