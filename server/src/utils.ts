import { Response } from "express";

export function errorResponse(
  res: Response,
  message: string,
  status = 400
) {
  console.error(message);

  return res.status(status).json({
    success: false,
    message
  });
}

export function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validAmount(amount: number) {
  return Number.isFinite(amount) && amount > 0;
}