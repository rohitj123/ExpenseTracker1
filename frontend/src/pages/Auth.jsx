import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  KeyRound,
  LockKeyhole,
  LogIn,
  Mail,
  ShieldCheck,
  UserPlus,
  WalletCards,
} from "lucide-react";
import heroImage from "../assets/hero.png";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const Auth = ({ mode, setToken, setUser }) => {
  const isRegister = mode === "register";
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    currency: "INR",
    country: "India",
  });
  const [resetForm, setResetForm] = useState({
    email: "",
    code: "",
    token: "",
    newPassword: "",
  });
  const [otpForm, setOtpForm] = useState({
    email: "",
    emailOtp: "",
    mobileOtp: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verifyToken = params.get("verifyToken");
    const resetToken = params.get("resetToken");
    const googleToken = params.get("googleToken");
    const email = params.get("email") || "";

    if (resetToken) {
      setResetForm((current) => ({ ...current, email, token: resetToken }));
      setMessage("Reset link verified. Enter a new password to continue.");
      return;
    }

    const verifyLink = async () => {
      try {
        if (verifyToken) {
          const response = await axios.post(
            `${BASE_URL}/user/verify-email-link`,
            {
              token: verifyToken,
            },
          );
          setMessage(response.data.message || "Email verified successfully.");
        }

        if (googleToken && email) {
          const response = await axios.post(`${BASE_URL}/user/google-login`, {
            name: email.split("@")[0],
            email,
            verificationToken: googleToken,
          });
          localStorage.setItem("token", response.data.token);
          localStorage.setItem("user", JSON.stringify(response.data.user));
          setToken(response.data.token);
          setUser(response.data.user);
          setMessage("Google account verified successfully.");
          navigate("/income", { replace: true });
        }
      } catch (error) {
        setMessage(
          error.response?.data?.message || "Verification link failed.",
        );
      }
    };

    if (verifyToken || googleToken) {
      verifyLink();
    }
  }, [navigate, setToken, setUser]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleResetChange = (event) => {
    const { name, value } = event.target;
    setResetForm((current) => ({ ...current, [name]: value }));
  };

  const handleOtpChange = (event) => {
    const { name, value } = event.target;
    setOtpForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const endpoint = isRegister ? "/user/register" : "/user/login";
      const payload = isRegister
        ? form
        : { email: form.email, password: form.password };
      const response = await axios.post(`${BASE_URL}${endpoint}`, payload);
      const { token, user } = response.data;

      if (!token) {
        setMessage("Sign-in succeeded, but no token was returned.");
        return;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      setToken(token);
      setUser(user);
      if (isRegister) {
        setOtpForm({
          email: form.email,
          emailOtp: response.data.emailOtp || "",
          mobileOtp: response.data.mobileOtp || "",
        });
      }
      if (response.data.emailOtp || response.data.mobileOtp) {
        setMessage(
          `Account created. Email OTP: ${response.data.emailOtp || "-"} | Mobile OTP: ${
            response.data.mobileOtp || "-"
          } | Email link: ${response.data.verificationLink || "-"}`,
        );
        return;
      }
      navigate("/income", { replace: true });
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setMessage("");

    try {
      const response = await axios.post(`${BASE_URL}/user/send-otp`, {
        email: otpForm.email || form.email,
        phone: form.phone,
      });
      setOtpForm((current) => ({
        ...current,
        email: current.email || form.email,
        emailOtp: response.data.emailOtp || "",
        mobileOtp: response.data.mobileOtp || "",
      }));
      setMessage(
        `OTP sent. Email OTP: ${response.data.emailOtp || "-"} | Mobile OTP: ${
          response.data.mobileOtp || "-"
        }`,
      );
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not send OTP.");
    }
  };

  const handleVerifyOtp = async () => {
    setMessage("");

    try {
      const response = await axios.post(`${BASE_URL}/user/verify-otp`, {
        email: otpForm.email || form.email,
        emailOtp: otpForm.emailOtp,
        mobileOtp: otpForm.mobileOtp,
      });
      localStorage.setItem("user", JSON.stringify(response.data.user));
      setUser(response.data.user);
      setMessage(response.data.message || "OTP verified successfully.");
      navigate("/income", { replace: true });
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not verify OTP.");
    }
  };

  const handleGoogleLogin = async () => {
    setMessage("");
    setLoading(true);

    try {
      if (!form.email) {
        setMessage("Enter email before using Google Login demo.");
        return;
      }

      const response = await axios.post(`${BASE_URL}/user/google-login`, {
        name: form.name || form.email.split("@")[0],
        email: form.email,
        phone: form.phone,
        currency: form.currency,
        country: form.country,
      });

      if (response.data.requiresVerification) {
        setMessage(
          `Google verification link generated: ${response.data.verificationLink}`,
        );
        return;
      }

      const { token, user } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      setToken(token);
      setUser(user);
      navigate("/income", { replace: true });
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Unable to use Google Login.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setMessage("");

    try {
      const response = await axios.post(`${BASE_URL}/user/forgot-password`, {
        email: resetForm.email || form.email,
      });
      setResetForm((current) => ({
        ...current,
        email: resetForm.email || form.email,
        code: response.data.resetCode || "",
        token: response.data.resetLink
          ? new URL(response.data.resetLink).searchParams.get("resetToken") ||
            ""
          : "",
      }));
      setMessage(
        `${response.data.message || "Password reset code generated."} Link: ${
          response.data.resetLink || "-"
        }`,
      );
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Could not request password reset.",
      );
    }
  };

  const handleResetPassword = async () => {
    setMessage("");

    try {
      const response = await axios.post(
        `${BASE_URL}/user/reset-password`,
        resetForm,
      );
      setMessage(response.data.message || "Password reset successfully.");
      setResetForm({ email: "", code: "", token: "", newPassword: "" });
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not reset password.");
    }
  };

  const baseInput =
    "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

  const messageBlock = message ? (
    <p className="mt-4 max-h-28 overflow-y-auto rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
      {message}
    </p>
  ) : null;

  const otpPanel = (
    <div className="rounded-lg border border-emerald-100 bg-emerald-50/80 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
        <Mail size={16} />
        Email & Mobile OTP Verification
      </div>
      <div className="space-y-3">
        <input
          name="email"
          type="email"
          value={otpForm.email}
          onChange={handleOtpChange}
          placeholder="Registered email"
          className={baseInput}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            name="emailOtp"
            value={otpForm.emailOtp}
            onChange={handleOtpChange}
            placeholder="Email OTP"
            className={baseInput}
          />
          <input
            name="mobileOtp"
            value={otpForm.mobileOtp}
            onChange={handleOtpChange}
            placeholder="Mobile OTP"
            className={baseInput}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleSendOtp}
            className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
          >
            Send OTP
          </button>
          <button
            type="button"
            onClick={handleVerifyOtp}
            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Verify OTP
          </button>
        </div>
      </div>
    </div>
  );

  if (isRegister) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] px-4 py-8">
        <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <section className="slide-left overflow-hidden rounded-lg bg-[#182033] text-white shadow-xl">
            <div className="bg-linear-to-br from-[#182033] via-[#243657] to-[#178f80] p-7 sm:p-10">
              <div className="inline-flex rounded-lg bg-white/15 p-3">
                <WalletCards size={30} />
              </div>
              <h1 className="mt-6 text-3xl font-bold">
                Create your finance workspace
              </h1>
              <p className="mt-3 text-sm leading-6 text-white/80">
                Register with profile details, verify your email and mobile
                number, then start managing goals, budgets, reports, and
                accounts.
              </p>
            </div>
          </section>

          <section className="slide-right rounded-lg border border-gray-100 bg-white p-5 shadow-xl sm:p-7">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">
                  New account
                </p>
                <h2 className="mt-1 text-2xl font-bold text-gray-950">
                  Registration
                </h2>
              </div>
              <span className="rounded-lg bg-emerald-50 p-3 text-emerald-700">
                <UserPlus size={22} />
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Full Name">
                  <input
                    required
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className={baseInput}
                  />
                </FormField>
                <FormField label="Phone">
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className={baseInput}
                  />
                </FormField>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Email">
                  <input
                    required
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    className={baseInput}
                  />
                </FormField>
                <FormField label="Password">
                  <input
                    required
                    minLength={8}
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    className={baseInput}
                  />
                </FormField>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Currency">
                  <input
                    name="currency"
                    value={form.currency}
                    onChange={handleChange}
                    className={baseInput}
                  />
                </FormField>
                <FormField label="Country">
                  <input
                    name="country"
                    value={form.country}
                    onChange={handleChange}
                    className={baseInput}
                  />
                </FormField>
              </div>

              {messageBlock}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <LockKeyhole size={18} />
                {loading ? "Creating..." : "Create Account"}
              </button>
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Mail size={18} />
                Google Login
              </button>
            </form>

            <div className="mt-5">{otpPanel}</div>

            <p className="mt-5 text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-emerald-700 hover:text-emerald-800"
              >
                Login
              </Link>
            </p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white p-0 md:bg-[#f5f5f7] md:p-6">
      <div className="mx-auto grid min-h-screen overflow-hidden bg-white shadow-2xl md:min-h-[calc(100vh-3rem)] md:max-w-6xl md:rounded-lg lg:grid-cols-[42%_58%]">
        <section className="slide-left relative hidden min-h-full overflow-hidden bg-[#241f2c] text-white lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(124,88,255,0.45),transparent_24rem)]" />
          <img
            src={heroImage}
            alt=""
            className="absolute left-1/2 top-1/2 w-[78%] -translate-x-1/2 -translate-y-1/2 opacity-90 drop-shadow-2xl"
          />
          <div className="absolute inset-0 bg-linear-to-b from-black/25 via-black/10 to-black/70" />

          <div className="relative z-10 flex h-full min-h-162.5 flex-col justify-between p-8">
            <div className="flex items-center gap-2 text-lg font-bold">
              <span className="grid grid-cols-2 gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-white" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-white" />
              </span>
              Expense Tracker
            </div>

            <div>
              <p className="max-w-sm text-3xl font-bold leading-tight">
                "Simply all the tools that my budget and goals need."
              </p>
              <div className="mt-8">
                <p className="text-sm font-semibold">Personal Finance</p>
                <p className="mt-1 text-xs text-white/70">
                  Dashboard, goals, budgets, reports
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="slide-right flex items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-90">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 lg:hidden">
                <WalletCards size={24} />
              </div>
              <h1 className="text-2xl font-bold text-gray-950">
                Welcome back to Expense Tracker
              </h1>
              <p className="mx-auto mt-2 max-w-xs text-xs leading-5 text-gray-500">
                Manage your income, expenses, budgets, savings goals, and
                reports.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-500">
                  Email
                </span>
                <input
                  required
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="alex@example.com"
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-500">
                  Password
                </span>
                <input
                  required
                  minLength={8}
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
                />
              </label>

              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="font-semibold text-violet-600 hover:text-violet-700"
                >
                  Forgot password?
                </button>
                <label className="flex items-center gap-2 text-gray-500">
                  <span>Remember sign in details</span>
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    defaultChecked
                  />
                  <span className="h-5 w-9 rounded-full bg-violet-600 p-0.5 after:block after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4" />
                </label>
              </div>

              {messageBlock}

              <button
                type="submit"
                disabled={loading}
                className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200 hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Please wait..." : "Log in"}
              </button>
            </form>

            <div className="my-5 flex items-center gap-3 text-xs text-gray-400">
              <span className="h-px flex-1 bg-gray-200" />
              <span>OR</span>
              <span className="h-px flex-1 bg-gray-200" />
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span className="text-lg font-bold text-[#4285f4]">G</span>
              Continue with Google
            </button>

            <details className="mt-5 rounded-lg border border-gray-100 bg-gray-50 p-3">
              <summary className="cursor-pointer text-xs font-semibold text-gray-700">
                Reset password with code or link
              </summary>
              <div className="mt-3 space-y-2">
                <input
                  name="email"
                  type="email"
                  value={resetForm.email}
                  onChange={handleResetChange}
                  placeholder="Email"
                  className={baseInput}
                />
                <input
                  name="code"
                  value={resetForm.code}
                  onChange={handleResetChange}
                  placeholder="Reset code"
                  className={baseInput}
                />
                <input
                  name="token"
                  value={resetForm.token}
                  onChange={handleResetChange}
                  placeholder="Reset link token"
                  className={baseInput}
                />
                <input
                  name="newPassword"
                  type="password"
                  value={resetForm.newPassword}
                  onChange={handleResetChange}
                  placeholder="New password"
                  className={baseInput}
                />
                <button
                  type="button"
                  onClick={handleResetPassword}
                  className="w-full rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-700"
                >
                  Reset Password
                </button>
              </div>
            </details>

            <details className="mt-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
              <summary className="cursor-pointer text-xs font-semibold text-gray-700">
                Email and mobile OTP verification
              </summary>
              <div className="mt-3">{otpPanel}</div>
            </details>

            <p className="mt-6 text-center text-xs text-gray-500">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-semibold text-violet-600 hover:text-violet-700"
              >
                Sign up
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};

const FormField = ({ label, children }) => (
  <label className="block">
    <span className="mb-1 block text-sm font-medium text-gray-700">
      {label}
    </span>
    {children}
  </label>
);

export default Auth;
