import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

const SECRET = process.env.JWT_SECRET || "development-secret";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(
  password: string,
  hash: string
) {
  return bcrypt.compare(password, hash);
}

export function createToken(userId: string, role: string) {
  return jwt.sign(
    { userId, role },
    SECRET,
    { expiresIn: "1h" }
  );
}

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Authentication required"
    });
  }

  try {
    const token = header.split(" ")[1];

    const decoded = jwt.verify(token, SECRET) as {
      userId: string;
      role: string;
    };

    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }
}

export function adminOnly(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      message: "Admin access required"
    });
  }

  next();
}