import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  ArrowRightLeft,
  Building2,
  CreditCard,
  Landmark,
  Pencil,
  Plus,
  Trash2,
  Wallet,
} from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const ACCOUNT_TYPES = ["Savings", "Current", "Wallet", "Credit Card"];
const STATUSES = ["Completed", "Pending", "Failed"];

const initialAccountForm = {
  bankName: "",
  accountType: "Savings",
  balance: "",
};

const initialTransferForm = {
  fromAccountId: "",
  toAccountId: "",
  amount: "",
  date: "",
  status: "Completed",
};

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const getAccountErrorMessage = (error, fallback) => {
  if (!localStorage.getItem("token")) {
    return "Please sign in to load and manage bank accounts.";
  }

  if (!error.response) {
    return "Account server is not reachable. Start the backend on port 4000 and try again.";
  }

  if (error.response.status === 401) {
    return "Your session has expired. Please sign in again.";
  }

  return error.response?.data?.message || fallback;
};

const Account = () => {
  const [accounts, setAccounts] = useState([]);
  const [accountForm, setAccountForm] = useState(initialAccountForm);
  const [transferForm, setTransferForm] = useState(initialTransferForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const authHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchAccounts = async () => {
    if (!localStorage.getItem("token")) {
      setAccounts([]);
      setMessage("Please sign in to load and manage bank accounts.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await axios.get(`${BASE_URL}/account/get`, {
        headers: authHeaders(),
      });
      const data = Array.isArray(response.data) ? response.data : [];
      setAccounts(data);
      setTransferForm((current) => ({
        ...current,
        fromAccountId: current.fromAccountId || data[0]?._id || "",
        toAccountId: current.toAccountId || data[1]?._id || "",
      }));
    } catch (error) {
      setMessage(getAccountErrorMessage(error, "Unable to load accounts."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = useMemo(() => {
    const totalBalance = accounts.reduce(
      (sum, account) => sum + Number(account.balance || 0),
      0
    );
    const creditCards = accounts.filter(
      (account) => account.accountType === "Credit Card"
    ).length;

    return {
      totalBalance,
      count: accounts.length,
      creditCards,
    };
  }, [accounts]);

  const handleAccountChange = (event) => {
    const { name, value } = event.target;
    setAccountForm((current) => ({ ...current, [name]: value }));
  };

  const handleTransferChange = (event) => {
    const { name, value } = event.target;
    setTransferForm((current) => ({ ...current, [name]: value }));
  };

  const resetAccountForm = () => {
    setAccountForm(initialAccountForm);
    setEditingId(null);
  };

  const handleAccountSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    try {
      const payload = {
        ...accountForm,
        balance: Number(accountForm.balance),
      };

      if (editingId) {
        await axios.put(`${BASE_URL}/account/update/${editingId}`, payload, {
          headers: authHeaders(),
        });
        setMessage("Account updated successfully.");
      } else {
        await axios.post(`${BASE_URL}/account/add`, payload, {
          headers: authHeaders(),
        });
        setMessage("Account added successfully.");
      }

      resetAccountForm();
      fetchAccounts();
    } catch (error) {
      setMessage(getAccountErrorMessage(error, "Could not save account."));
    }
  };

  const handleEdit = (account) => {
    setEditingId(account._id);
    setAccountForm({
      bankName: account.bankName || "",
      accountType: account.accountType || "Savings",
      balance: account.balance || "",
    });
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${BASE_URL}/account/delete/${id}`, {
        headers: authHeaders(),
      });
      setMessage("Account deleted.");
      fetchAccounts();
    } catch (error) {
      setMessage(getAccountErrorMessage(error, "Could not delete account."));
    }
  };

  const handleTransferSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    try {
      await axios.post(
        `${BASE_URL}/account/transfer`,
        {
          ...transferForm,
          amount: Number(transferForm.amount),
        },
        { headers: authHeaders() }
      );
      setTransferForm((current) => ({
        ...initialTransferForm,
        fromAccountId: current.fromAccountId,
        toAccountId: current.toAccountId,
      }));
      setMessage("Account transfer completed successfully.");
      fetchAccounts();
    } catch (error) {
      setMessage(getAccountErrorMessage(error, "Could not transfer amount."));
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bank Account Management
        </h1>
        <p className="text-sm text-gray-600">
          Manage savings, current, wallet, and credit card accounts.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          icon={<Landmark size={20} />}
          label="Total Balance"
          value={currency.format(summary.totalBalance)}
        />
        <SummaryCard
          icon={<Wallet size={20} />}
          label="Accounts"
          value={summary.count}
        />
        <SummaryCard
          icon={<CreditCard size={20} />}
          label="Credit Cards"
          value={summary.creditCards}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <div className="space-y-6">
          <form
            onSubmit={handleAccountSubmit}
            className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm"
          >
            <div className="mb-5 flex items-center gap-2">
              <Building2 className="text-indigo-600" size={20} />
              <h2 className="text-lg font-semibold text-gray-900">
                {editingId ? "Edit Account" : "Add Account"}
              </h2>
            </div>

            <div className="space-y-4">
              <FormField label="Bank Name">
                <input
                  required
                  name="bankName"
                  type="text"
                  value={accountForm.bankName}
                  onChange={handleAccountChange}
                  placeholder="HDFC Bank"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </FormField>

              <FormField label="Account Type">
                <select
                  required
                  name="accountType"
                  value={accountForm.accountType}
                  onChange={handleAccountChange}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                >
                  {ACCOUNT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Balance">
                <input
                  required
                  name="balance"
                  type="number"
                  value={accountForm.balance}
                  onChange={handleAccountChange}
                  placeholder="25000"
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
                {editingId ? "Update" : "Add Account"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetAccountForm}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <form
            onSubmit={handleTransferSubmit}
            className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm"
          >
            <div className="mb-5 flex items-center gap-2">
              <ArrowRightLeft className="text-indigo-600" size={20} />
              <h2 className="text-lg font-semibold text-gray-900">
                Account Transfer
              </h2>
            </div>

            <div className="space-y-4">
              <FormField label="From Account">
                <AccountSelect
                  name="fromAccountId"
                  value={transferForm.fromAccountId}
                  onChange={handleTransferChange}
                  accounts={accounts}
                />
              </FormField>

              <FormField label="To Account">
                <AccountSelect
                  name="toAccountId"
                  value={transferForm.toAccountId}
                  onChange={handleTransferChange}
                  accounts={accounts}
                />
              </FormField>

              <FormField label="Amount">
                <input
                  required
                  min="1"
                  name="amount"
                  type="number"
                  value={transferForm.amount}
                  onChange={handleTransferChange}
                  placeholder="5000"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </FormField>

              <FormField label="Date">
                <input
                  required
                  name="date"
                  type="date"
                  value={transferForm.date}
                  onChange={handleTransferChange}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </FormField>

              <FormField label="Status">
                <select
                  required
                  name="status"
                  value={transferForm.status}
                  onChange={handleTransferChange}
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

            <button
              type="submit"
              disabled={accounts.length < 2}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              <ArrowRightLeft size={18} />
              Transfer Amount
            </button>
          </form>
        </div>

        <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-gray-900">
              Multiple Accounts
            </h2>
            <p className="text-sm text-gray-500">
              Track balances by bank and account type.
            </p>
          </div>

          {message && (
            <p className="mb-4 rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-800">
              {message}
            </p>
          )}

          <div className="grid gap-3 lg:grid-cols-2">
            {loading && (
              <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
                Loading accounts...
              </p>
            )}

            {!loading && accounts.length === 0 && (
              <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
                No accounts added yet.
              </p>
            )}

            {accounts.map((account) => (
              <article
                key={account._id}
                className="rounded-lg border border-gray-100 p-4 hover:border-indigo-200"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-indigo-50 p-2 text-indigo-700">
                        {accountIcon(account.accountType)}
                      </span>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {account.bankName}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {account.accountType}
                        </p>
                      </div>
                    </div>
                    <p className="mt-4 text-2xl font-bold text-gray-900">
                      {currency.format(Number(account.balance || 0))}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(account)}
                      className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"
                      aria-label="Edit account"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(account._id)}
                      className="rounded-lg border border-red-100 p-2 text-red-600 hover:bg-red-50"
                      aria-label="Delete account"
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

const accountIcon = (type) => {
  if (type === "Credit Card") return <CreditCard size={16} />;
  if (type === "Wallet") return <Wallet size={16} />;
  return <Landmark size={16} />;
};

const AccountSelect = ({ accounts, ...props }) => (
  <select
    required
    {...props}
    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
  >
    <option value="">Select account</option>
    {accounts.map((account) => (
      <option key={account._id} value={account._id}>
        {account.bankName} - {account.accountType}
      </option>
    ))}
  </select>
);

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

export default Account;
