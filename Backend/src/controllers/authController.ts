import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import AppError from '../utils/AppError';
import asyncHandler from '../utils/asyncHandler';

// ─── Helper: sign JWT ─────────────────────────────────────────────────────────

const signToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  if (!secret) throw new Error('JWT_SECRET is not configured');

  return jwt.sign({ id: userId }, secret, { expiresIn } as jwt.SignOptions);
};

// ─── Helper: build safe user object (no password) ────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const buildUserResponse = (user: any) => ({
  _id: String(user._id),
  username: user.username,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
});

// ─── POST /api/auth/signup ────────────────────────────────────────────────────

export const signup = asyncHandler(async (req: Request, res: Response) => {
  console.log('[SIGNUP CONTROLLER] reached');
  const { username, firstName, lastName, email, password } = req.body;

  // — Input validation —
  if (!username || !firstName || !lastName || !email || !password) {
    throw new AppError('All fields are required: username, firstName, lastName, email, password', 400);
  }

  if (typeof password !== 'string' || password.length < 6) {
    throw new AppError('Password must be at least 6 characters', 400);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    throw new AppError('Please provide a valid email address', 400);
  }

  // — Check for existing account (pre-emptive check before Mongoose unique index)
  const existingEmail = await User.findOne({ email: email.trim().toLowerCase() });
  if (existingEmail) {
    throw new AppError('An account with this email already exists', 409);
  }

  const existingUsername = await User.findOne({ username: username.trim() });
  if (existingUsername) {
    throw new AppError('Username is already taken', 409);
  }

  // — Create user (password hashed by pre-save hook in the model) —
  const user = await User.create({
    username: username.trim(),
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email.trim().toLowerCase(),
    password,
  });

  const token = signToken(String(user._id));

  res.status(201).json({
    success: true,
    token,
    user: buildUserResponse(user),
  });
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // — Input validation —
  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  // — Find user and include password field (select: false by default) —
  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');

  // — Use a constant-time comparison to avoid timing attacks —
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Incorrect email or password', 401);
  }

  const token = signToken(String(user._id));

  res.status(200).json({
    success: true,
    token,
    user: buildUserResponse(user),
  });
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
// Protected route — called by AuthContext.bootstrapAsync() on app launch

export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  // req.user is populated by the protect middleware — never trust req.body
  const user = req.user!;

  const token = signToken(String(user._id));

  res.status(200).json({
    success: true,
    token,
    user: buildUserResponse(user),
  });
});
