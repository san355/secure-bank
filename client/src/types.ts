export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
}

export interface Account {
  _id: string;
  accountNumber: string;
  balance: number;
}

export interface Transaction {
  _id: string;
  sender: string;
  receiver: string;
  amount: number;
  status: string;
  createdAt: string;
}