import User from "../models/userModel.js";
import validator from "validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRES = "24h";

const createToken = (userId) =>
  jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRES });

const createCode = () => Math.floor(100000 + Math.random() * 900000).toString();
const createSecureToken = () => crypto.randomBytes(24).toString("hex");
const getClientUrl = (req) => req.body.clientUrl || process.env.CLIENT_URL || "http://localhost:5173";

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone || "",
  currency: user.currency || "INR",
  country: user.country || "India",
  authProvider: user.authProvider || "local",
  isEmailVerified: Boolean(user.isEmailVerified),
  isPhoneVerified: Boolean(user.isPhoneVerified),
});

// Register a User

export async function registrationUser(req, res) {
  const { name, email, password, phone = "", currency = "INR", country = "India" } =
    req.body;
  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "All fields are required.",
    });
  }
  if (!validator.isEmail(email)) {
    return res.status(400).json({
      success: false,
      message: "Invalid email",
    });
  }
  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      message: "Password must be atleast of 8 characters.",
    });
  }

  try {
    if (await User.findOne({ email })) {
      return res.status(409).json({
        success: false,
        message: "User already present",
      });
    }
    const hashed = await bcrypt.hash(password, 10);
    const emailVerificationToken = createSecureToken();
    const emailVerificationCode = createCode();
    const phoneVerificationCode = createCode();
    const user = await User.create({
      name,
      email,
      password: hashed,
      phone,
      currency,
      country,
      emailVerificationCode,
      phoneVerificationCode,
      emailVerificationToken,
    });
    const token = createToken(user._id);
    res.status(201).json({
      success: true,
      token,
      user: publicUser(user),
      message: "Registration successful. Verify your email using the verification link.",
      verificationLink: `${getClientUrl(req)}/login?verifyToken=${emailVerificationToken}`,
      emailOtp: emailVerificationCode,
      mobileOtp: phoneVerificationCode,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

// to login a user
export async function loginUser(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Both fields are required.",
    });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }
    const token = createToken(user._id);
    res.json({
      success: true,
      token,
      user: publicUser(user),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

// to get login user detail

export async function getCurrentUser(req, res) {
  try {
    const user = await User.findById(req.user.id).select(
      "name email phone currency country authProvider isEmailVerified isPhoneVerified"
    );
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not Found",
      });
    }
    res.json({ success: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

// to update a user profile
export async function updateProfile(req, res) {
  const { name, email, phone = "", currency = "INR", country = "India" } = req.body;
  if (!name || !email || !validator.isEmail(email)) {
    return res.status(400).json({
      success: false,
      message: "Valid email and name are required.",
    });
  }
  try {
    const exists = await User.findOne({ email, _id: { $ne: req.user.id } });
    if (exists) {
      return res.status(409).json({
        success: false,
        message: "Email already in use.",
      });
    }
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, email, phone, currency, country },
      {
        new: true,
        runValidators: true,
        select: "name email phone currency country authProvider isEmailVerified isPhoneVerified",
      },
    );
    res.json({
      success: true,
      user: publicUser(user),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

export async function googleLogin(req, res) {
  const { name, email, phone = "", currency = "INR", country = "India", verificationToken } = req.body;

  if (!name || !email || !validator.isEmail(email)) {
    return res.status(400).json({
      success: false,
      message: "Valid Google name and email are required.",
    });
  }

  try {
    let user = await User.findOne({ email });

    if (verificationToken) {
      if (!user || verificationToken !== user.googleVerificationToken) {
        return res.status(400).json({
          success: false,
          message: "Invalid Google verification link.",
        });
      }
    } else if (!user) {
      user = await User.create({
        name,
        email,
        phone,
        currency,
        country,
        password: await bcrypt.hash(createCode(), 10),
        authProvider: "google",
        isEmailVerified: false,
        isPhoneVerified: false,
        googleVerificationToken: createSecureToken(),
        phoneVerificationCode: createCode(),
      });
    } else {
      user.authProvider = "google";
      user.googleVerificationToken = createSecureToken();
      await user.save();
    }

    if (!verificationToken) {
      return res.json({
        success: true,
        requiresVerification: true,
        message: "Google verification required. Use the generated verification link.",
        verificationToken: user.googleVerificationToken,
        verificationLink: `${getClientUrl(req)}/login?googleToken=${user.googleVerificationToken}&email=${encodeURIComponent(email)}`,
      });
    }

    user.isEmailVerified = true;
    user.googleVerificationToken = "";
    await user.save();

    const token = createToken(user._id);
    res.json({
      success: true,
      token,
      user: publicUser(user),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

export async function requestEmailVerification(req, res) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    user.emailVerificationCode = createCode();
    user.phoneVerificationCode = createCode();
    user.emailVerificationToken = createSecureToken();
    await user.save();

    res.json({
      success: true,
      message: "Verification code and link generated.",
      verificationCode: user.emailVerificationCode,
      mobileOtp: user.phoneVerificationCode,
      verificationLink: `${getClientUrl(req)}/login?verifyToken=${user.emailVerificationToken}`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

export async function requestPasswordChangeVerification(req, res) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    user.passwordResetCode = createCode();
    await user.save();

    res.json({
      success: true,
      message: "Password change verification code generated.",
      verificationCode: user.passwordResetCode,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

export async function verifyEmail(req, res) {
  const { code, token } = req.body;

  try {
    const user = token
      ? await User.findOne({ emailVerificationToken: token })
      : await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (!token && (!code || code !== user.emailVerificationCode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code.",
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationCode = "";
    user.emailVerificationToken = "";
    await user.save();

    res.json({
      success: true,
      message: "Email verified successfully.",
      user: publicUser(user),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

export async function sendOtp(req, res) {
  const { email, phone } = req.body;

  if (!email && !phone) {
    return res.status(400).json({
      success: false,
      message: "Email or mobile number is required.",
    });
  }

  try {
    const query = email ? { email } : { phone };
    const user = await User.findOne(query);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    user.emailVerificationCode = createCode();
    user.phoneVerificationCode = createCode();
    await user.save();

    res.json({
      success: true,
      message: "OTP sent to registered email and mobile number.",
      emailOtp: user.emailVerificationCode,
      mobileOtp: user.phoneVerificationCode,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

export async function verifyOtp(req, res) {
  const { email, emailOtp, mobileOtp } = req.body;

  if (!email || (!emailOtp && !mobileOtp)) {
    return res.status(400).json({
      success: false,
      message: "Email and at least one OTP are required.",
    });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (emailOtp && emailOtp !== user.emailVerificationCode) {
      return res.status(400).json({
        success: false,
        message: "Invalid email OTP.",
      });
    }

    if (mobileOtp && mobileOtp !== user.phoneVerificationCode) {
      return res.status(400).json({
        success: false,
        message: "Invalid mobile OTP.",
      });
    }

    if (emailOtp) {
      user.isEmailVerified = true;
      user.emailVerificationCode = "";
    }

    if (mobileOtp) {
      user.isPhoneVerified = true;
      user.phoneVerificationCode = "";
    }

    await user.save();

    res.json({
      success: true,
      message: "OTP verification updated.",
      user: publicUser(user),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

export async function forgotPassword(req, res) {
  const { email } = req.body;

  if (!email || !validator.isEmail(email)) {
    return res.status(400).json({
      success: false,
      message: "Valid email is required.",
    });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    user.passwordResetCode = createCode();
    user.passwordResetToken = createSecureToken();
    await user.save();

    res.json({
      success: true,
      message: "Password reset verification link generated.",
      resetCode: user.passwordResetCode,
      resetLink: `${getClientUrl(req)}/login?resetToken=${user.passwordResetToken}&email=${encodeURIComponent(email)}`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

export async function resetPassword(req, res) {
  const { email, code, token, newPassword } = req.body;

  if ((!email && !token) || (!code && !token) || !newPassword || newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      message: "Email, reset code, and 8 character password are required.",
    });
  }

  try {
    const user = token
      ? await User.findOne({ passwordResetToken: token })
      : await User.findOne({ email });
    if (!user || (!token && user.passwordResetCode !== code)) {
      return res.status(400).json({
        success: false,
        message: "Invalid reset request.",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.passwordResetCode = "";
    user.passwordResetToken = "";
    await user.save();

    res.json({
      success: true,
      message: "Password reset successfully.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

// to change user password

export async function updatePassword(req, res) {
  const { currentPassword, newPassword, verificationCode } = req.body;
  if (!currentPassword || !newPassword || newPassword.length < 8 || !verificationCode) {
    return res.status(400).json({
      success: false,
      message: "Current password, verification code, and 8 character new password are required.",
    });
  }
  try {
    const user = await User.findById(req.user.id).select("password passwordResetCode");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }
    if (verificationCode !== user.passwordResetCode) {
      return res.status(400).json({
        success: false,
        message: "Invalid password change verification code.",
      });
    }
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Current Password is incorrect.",
      });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    user.passwordResetCode = "";
    await user.save();
    res.json({
      success: true,
      message: "Password changed",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}
