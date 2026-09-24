import { useEffect, useState } from "react";
import API from "./api";
import type { Account, Transaction } from "./types";

export function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function login(e: React.FormEvent) {
    e.preventDefault();

    try {
      const { data } = await API.post("/auth/login", {
        email,
        password
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      onLogin();
    } catch (error: any) {
      alert(error.response?.data?.message || "Login failed");
    }
  }

  return (
    <form onSubmit={login}>
      <h2>SecureBank Login</h2>

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button>Login</button>
    </form>
  );
}

export function Dashboard() {
  const [account, setAccount] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");

  async function load() {
    const accountResponse = await API.get("/account");
    const transactionResponse =
      await API.get("/transactions");

    setAccount(accountResponse.data);
    setTransactions(transactionResponse.data);
  }

  useEffect(() => {
    load();
  }, []);

  async function transfer() {
    try {
      await API.post(
        "/transfer",
        {
          receiverAccountNumber: receiver,
          amount: Number(amount)
        },
        {
          headers: {
            "Idempotency-Key": crypto.randomUUID()
          }
        }
      );

      alert("Transfer successful");

      setReceiver("");
      setAmount("");

      load();
    } catch (error: any) {
      alert(
        error.response?.data?.message ||
        "Transfer failed"
      );
    }
  }

  function logout() {
    localStorage.clear();
    window.location.reload();
  }

  return (
    <div>
      <button onClick={logout}>Logout</button>

      <h1>SecureBank Dashboard</h1>

      <h2>
        Balance: ₹{account?.balance ?? 0}
      </h2>

      <h3>Transfer Money</h3>

      <input
        placeholder="Receiver Account Number"
        value={receiver}
        onChange={(e) => setReceiver(e.target.value)}
      />

      <input
        placeholder="Amount"
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <button onClick={transfer}>
        Transfer
      </button>

      <h3>Transactions</h3>

      {transactions.map((transaction) => (
        <div key={transaction._id}>
          ₹{transaction.amount} —{" "}
          {transaction.status} —{" "}
          {new Date(transaction.createdAt).toLocaleString()}
        </div>
      ))}
    </div>
  );
}