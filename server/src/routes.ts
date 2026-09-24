import { Router } from "express";
import crypto from "crypto";

import {
  User,
  Account,
  Transaction,
  AuditLog
} from "./models.js";

import {
  authenticate,
  adminOnly,
  hashPassword,
  comparePassword,
  createToken,
  AuthRequest
} from "./auth.js";

import { errorResponse, validEmail, validAmount } from "./utils.js";

const router = Router();

/* REGISTER */

router.post("/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return errorResponse(res, "All fields are required");
    }

    if (!validEmail(email)) {
      return errorResponse(res, "Invalid email");
    }

    if (password.length < 6) {
      return errorResponse(
        res,
        "Password must contain at least 6 characters"
      );
    }

    const existing = await User.findOne({ email });

    if (existing) {
      return errorResponse(res, "Email already registered");
    }

    const hashed = await hashPassword(password);

    const user = await User.create({
      name,
      email,
      password: hashed,
      role: "user"
    });

    const account = await Account.create({
      userId: user._id,
      accountNumber: "AC" + Date.now(),
      balance: 10000
    });

    await AuditLog.create({
      userId: user._id,
      action: "REGISTER",
      details: "New customer registered"
    });

    res.status(201).json({
      message: "Registration successful",
      accountNumber: account.accountNumber
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

/* LOGIN */

router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return errorResponse(res, "Invalid email or password", 401);
    }

    const valid = await comparePassword(password, user.password);

    if (!valid) {
      return errorResponse(res, "Invalid email or password", 401);
    }

    const token = createToken(
      user._id.toString(),
      user.role
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

/* MY ACCOUNT */

router.get(
  "/account",
  authenticate,
  async (req: AuthRequest, res) => {
    try {
      const account = await Account.findOne({
        userId: req.user!.userId
      });

      if (!account) {
        return errorResponse(res, "Account not found", 404);
      }

      res.json(account);
    } catch {
      res.status(500).json({ message: "Server error" });
    }
  }
);

/* TRANSFER */

router.post(
  "/transfer",
  authenticate,
  async (req: AuthRequest, res) => {
    try {
      const { receiverAccountNumber, amount } = req.body;

      const idempotencyKey =
        req.headers["idempotency-key"]?.toString();

      if (!idempotencyKey) {
        return errorResponse(
          res,
          "Idempotency-Key header is required"
        );
      }

      if (!validAmount(amount)) {
        return errorResponse(res, "Invalid amount");
      }

      const previous = await Transaction.findOne({
        idempotencyKey
      });

      if (previous) {
        return res.json({
          message: "Request already processed",
          transaction: previous
        });
      }

      const sender = await Account.findOne({
        userId: req.user!.userId
      });

      const receiver = await Account.findOne({
        accountNumber: receiverAccountNumber
      });

      if (!sender || !receiver) {
        return errorResponse(
          res,
          "Sender or receiver account not found",
          404
        );
      }

      if (sender._id.equals(receiver._id)) {
        return errorResponse(
          res,
          "Cannot transfer to the same account"
        );
      }

      if (sender.balance < amount) {
        const failed = await Transaction.create({
          sender: sender._id,
          receiver: receiver._id,
          amount,
          status: "failed",
          idempotencyKey
        });

        return res.status(400).json({
          message: "Insufficient balance",
          transaction: failed
        });
      }

      sender.balance -= amount;
      receiver.balance += amount;

      await sender.save();
      await receiver.save();

      const transaction = await Transaction.create({
        sender: sender._id,
        receiver: receiver._id,
        amount,
        status: "completed",
        idempotencyKey
      });

      await AuditLog.create({
        userId: req.user!.userId,
        action: "TRANSFER",
        details: `Transferred ${amount}`
      });

      res.json({
        message: "Transfer successful",
        transaction
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Transfer failed"
      });
    }
  }
);

/* TRANSACTIONS */

router.get(
  "/transactions",
  authenticate,
  async (req: AuthRequest, res) => {
    try {
      const account = await Account.findOne({
        userId: req.user!.userId
      });

      if (!account) {
        return errorResponse(res, "Account not found", 404);
      }

      const transactions = await Transaction.find({
        $or: [
          { sender: account._id },
          { receiver: account._id }
        ]
      })
        .sort({ createdAt: -1 })
        .limit(100);

      res.json(transactions);
    } catch {
      res.status(500).json({
        message: "Server error"
      });
    }
  }
);

/* ADMIN USERS */

router.get(
  "/admin/users",
  authenticate,
  adminOnly,
  async (_req, res) => {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.json(users);
  }
);

/* ADMIN TRANSACTIONS */

router.get(
  "/admin/transactions",
  authenticate,
  adminOnly,
  async (_req, res) => {
    const transactions = await Transaction.find()
      .sort({ createdAt: -1 })
      .limit(200);

    res.json(transactions);
  }
);

/* ADMIN LOGS */

router.get(
  "/admin/logs",
  authenticate,
  adminOnly,
  async (_req, res) => {
    const logs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(200);

    res.json(logs);
  }
);

export default router;