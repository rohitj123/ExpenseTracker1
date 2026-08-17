import express from 'express';
import {
  forgotPassword,
  getCurrentUser,
  googleLogin,
  loginUser,
  registrationUser,
  requestEmailVerification,
  requestPasswordChangeVerification,
  resetPassword,
  sendOtp,
  updatePassword,
  updateProfile,
  verifyOtp,
  verifyEmail,
} from '../controllers/userController.js';
import authMiddleware from '../middleware/auth.js';

const userRouter = express.Router();

userRouter.post("/register", registrationUser);
userRouter.post("/login", loginUser);
userRouter.post("/google-login", googleLogin);
userRouter.post("/forgot-password", forgotPassword);
userRouter.post("/reset-password", resetPassword);
userRouter.post("/verify-email-link", verifyEmail);
userRouter.post("/send-otp", sendOtp);
userRouter.post("/verify-otp", verifyOtp);

// Protected Routes

userRouter.get("/me", authMiddleware, getCurrentUser);
userRouter.put("/profile", authMiddleware, updateProfile);
userRouter.put("/password", authMiddleware, updatePassword);
userRouter.post("/email-verification", authMiddleware, requestEmailVerification);
userRouter.post("/password-verification", authMiddleware, requestPasswordChangeVerification);
userRouter.post("/verify-email", authMiddleware, verifyEmail);

export default userRouter;
