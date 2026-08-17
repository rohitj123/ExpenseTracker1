import React, { useEffect, useState } from "react";
import axios from "axios";
import { CheckCircle2, KeyRound, MailCheck, Save, User } from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const initialProfile = {
  name: "",
  email: "",
  phone: "",
  currency: "INR",
  country: "India",
};

const Profile = () => {
  const [profile, setProfile] = useState(initialProfile);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    verificationCode: "",
    newPassword: "",
  });
  const [verificationCode, setVerificationCode] = useState("");
  const [message, setMessage] = useState("");

  const authHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadProfile = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/user/me`, {
        headers: authHeaders(),
      });
      const user = response.data.user;
      setProfile({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        currency: user.currency || "INR",
        country: user.country || "India",
        isEmailVerified: user.isEmailVerified,
      });
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not load profile.");
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfile((current) => ({ ...current, [name]: value }));
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((current) => ({ ...current, [name]: value }));
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    try {
      const response = await axios.put(`${BASE_URL}/user/profile`, profile, {
        headers: authHeaders(),
      });
      localStorage.setItem("user", JSON.stringify(response.data.user));
      setMessage("Profile updated successfully.");
      loadProfile();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not update profile.");
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    try {
      const response = await axios.put(`${BASE_URL}/user/password`, passwordForm, {
        headers: authHeaders(),
      });
      setPasswordForm({ currentPassword: "", verificationCode: "", newPassword: "" });
      setMessage(response.data.message || "Password changed.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not change password.");
    }
  };

  const requestVerification = async () => {
    try {
      const response = await axios.post(
        `${BASE_URL}/user/email-verification`,
        {},
        { headers: authHeaders() }
      );
      setVerificationCode(response.data.verificationCode || "");
      setMessage(
        `${response.data.message || "Verification code generated."} Code: ${
          response.data.verificationCode || "-"
        } Link: ${response.data.verificationLink || "-"}`
      );
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not generate code.");
    }
  };

  const requestPasswordVerification = async () => {
    setMessage("");

    try {
      const response = await axios.post(
        `${BASE_URL}/user/password-verification`,
        {},
        { headers: authHeaders() }
      );
      setPasswordForm((current) => ({
        ...current,
        verificationCode: response.data.verificationCode || "",
      }));
      setMessage(
        `${response.data.message || "Password verification code generated."} Code: ${
          response.data.verificationCode || "-"
        }`
      );
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Could not generate password verification code."
      );
    }
  };

  const verifyEmail = async () => {
    try {
      const response = await axios.post(
        `${BASE_URL}/user/verify-email`,
        { code: verificationCode },
        { headers: authHeaders() }
      );
      setMessage(response.data.message || "Email verified.");
      loadProfile();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not verify email.");
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile Information</h1>
        <p className="text-sm text-gray-600">
          Manage name, email, phone, currency, country, password, and email verification.
        </p>
      </div>

      {message && (
        <p className="rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-800">
          {message}
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <form
          onSubmit={handleProfileSubmit}
          className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm"
        >
          <div className="mb-5 flex items-center gap-2">
            <User className="text-indigo-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">User Profile</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Name">
              <input
                required
                name="name"
                value={profile.name}
                onChange={handleProfileChange}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </FormField>
            <FormField label="Email">
              <input
                required
                name="email"
                type="email"
                value={profile.email}
                onChange={handleProfileChange}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </FormField>
            <FormField label="Phone">
              <input
                name="phone"
                value={profile.phone}
                onChange={handleProfileChange}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </FormField>
            <FormField label="Currency">
              <input
                name="currency"
                value={profile.currency}
                onChange={handleProfileChange}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </FormField>
            <FormField label="Country">
              <input
                name="country"
                value={profile.country}
                onChange={handleProfileChange}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </FormField>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-700">
                Email Verification
              </p>
              <p className="mt-1 inline-flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle2 size={16} />
                {profile.isEmailVerified ? "Verified" : "Not verified"}
              </p>
            </div>
          </div>

          <button
            type="submit"
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <Save size={18} />
            Save Profile
          </button>
        </form>

        <div className="space-y-6">
          <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <MailCheck className="text-indigo-600" size={20} />
              <h2 className="text-lg font-semibold text-gray-900">
                Email Verification
              </h2>
            </div>
            <input
              value={verificationCode}
              onChange={(event) => setVerificationCode(event.target.value)}
              placeholder="Verification code"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={requestVerification}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Get Code
              </button>
              <button
                type="button"
                onClick={verifyEmail}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Verify
              </button>
            </div>
          </div>

          <form
            onSubmit={handlePasswordSubmit}
            className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm"
          >
            <div className="mb-5 flex items-center gap-2">
              <KeyRound className="text-indigo-600" size={20} />
              <h2 className="text-lg font-semibold text-gray-900">
                Change Password
              </h2>
            </div>
            <div className="space-y-4">
              <FormField label="Current Password">
                <input
                  required
                  name="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </FormField>
              <FormField label="Verification Code">
                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <input
                    required
                    name="verificationCode"
                    value={passwordForm.verificationCode}
                    onChange={handlePasswordChange}
                    placeholder="Get code first"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                  <button
                    type="button"
                    onClick={requestPasswordVerification}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Get Code
                  </button>
                </div>
              </FormField>
              <FormField label="New Password">
                <input
                  required
                  minLength={8}
                  name="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </FormField>
            </div>
            <button
              type="submit"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <KeyRound size={18} />
              Change Password
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

const FormField = ({ label, children }) => (
  <label className="block">
    <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
    {children}
  </label>
);

export default Profile;
