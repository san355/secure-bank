import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "user" | "admin";
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    }
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>("User", userSchema);

export interface IAccount extends Document {
  userId: mongoose.Types.ObjectId;
  accountNumber: string;
  balance: number;
}

const accountSchema = new Schema<IAccount>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    accountNumber: {
      type: String,
      required: true,
      unique: true
    },
    balance: {
      type: Number,
      default: 10000,
      min: 0
    }
  },
  { timestamps: true }
);

export const Account = mongoose.model<IAccount>("Account", accountSchema);

export interface ITransaction extends Document {
  sender: mongoose.Types.ObjectId;
  receiver: mongoose.Types.ObjectId;
  amount: number;
  status: "completed" | "failed";
  idempotencyKey: string;
}

const transactionSchema = new Schema<ITransaction>(
  {
    sender: { type: Schema.Types.ObjectId, ref: "Account", required: true },
    receiver: { type: Schema.Types.ObjectId, ref: "Account", required: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["completed", "failed"],
      required: true
    },
    idempotencyKey: { type: String, required: true, unique: true }
  },
  { timestamps: true }
);

export const Transaction = mongoose.model<ITransaction>(
  "Transaction",
  transactionSchema
);

const auditSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    action: String,
    details: String
  },
  { timestamps: true }
);

export const AuditLog = mongoose.model("AuditLog", auditSchema);