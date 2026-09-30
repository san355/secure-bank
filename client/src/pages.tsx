import { useEffect, useState } from "react";
import API from "./api";
import type { Account, Transaction } from "./types";


interface LoginProps {
  onLogin: () => void;
  onRegister: () => void;
}

export function Login({ onLogin, onRegister }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function login(e: React.FormEvent<HTMLFormElement>) {
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
      alert(
        error.response?.data?.message ||
        "Login failed"
      );
    }
  }

  return (
    <form onSubmit={login}>
      <h2>SecureBank Login</h2>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <button type="submit">
        Login
      </button>

      <p>
        New customer?
      </p>

      <button
        type="button"
        onClick={onRegister}
      >
        Create Account
      </button>
    </form>
  );
}


interface RegisterProps {
  onLogin: () => void;
}

export function Register({ onLogin }: RegisterProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function register(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    try {
      await API.post("/auth/register", {
        name,
        email,
        password
      });

      alert(
        "Account created successfully. Please login."
      );

      onLogin();
    } catch (error: any) {
      alert(
        error.response?.data?.message ||
        "Registration failed"
      );
    }
  }

  return (
    <form onSubmit={register}>
      <h2>Create SecureBank Account</h2>

      <input
        type="text"
        placeholder="Full Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={6}
      />

      <button type="submit">
        Create Account
      </button>

      <p>
        Already have an account?
      </p>

      <button
        type="button"
        onClick={onLogin}
      >
        Back to Login
      </button>
    </form>
  );
}


export function Dashboard() {
  const [account, setAccount] =
    useState<Account | null>(null);

  const [transactions, setTransactions] =
    useState<Transaction[]>([]);

  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");

  async function load() {
    try {
      const accountResponse =
        await API.get("/account");

      const transactionResponse =
        await API.get("/transactions");

      setAccount(accountResponse.data);
      setTransactions(transactionResponse.data);
    } catch (error: any) {
      alert(
        error.response?.data?.message ||
        "Unable to load account"
      );
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function transfer() {
    if (!receiver || !amount) {
      alert("Enter receiver account and amount");
      return;
    }

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

      await load();
    } catch (error: any) {
      alert(
        error.response?.data?.message ||
        "Transfer failed"
      );
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.reload();
  }

  return (
    <div className="dashboard">

      <button
        className="logout"
        onClick={logout}
      >
        Logout
      </button>

      <h1>SecureBank Dashboard</h1>

      <div className="balance-card">
        <p>Available Balance</p>

        <h2>
          ₹{account?.balance ?? 0}
        </h2>

        <p>
          Account Number:{" "}
          {account?.accountNumber || "Loading..."}
        </p>
      </div>

      <div className="card-container">

        <div className="card">

          <h3>Transfer Money</h3>

          <input
            type="text"
            placeholder="Receiver Account Number"
            value={receiver}
            onChange={(e) =>
              setReceiver(e.target.value)
            }
          />

          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) =>
              setAmount(e.target.value)
            }
          />

          <button onClick={transfer}>
            Transfer Money
          </button>

        </div>

        <div className="card">

          <h3>Account Information</h3>

          <p>
            Account Number:
          </p>

          <strong>
            {account?.accountNumber}
          </strong>

          <p>
            Current Balance:
          </p>

          <strong>
            ₹{account?.balance ?? 0}
          </strong>

        </div>

      </div>

      <div className="transactions">

        <h3>Transaction History</h3>

        {transactions.length === 0 ? (
          <p>No transactions yet.</p>
        ) : (
          transactions.map((transaction) => (
            <div
              className="transaction"
              key={transaction._id}
            >
              <span>
                ₹{transaction.amount}
              </span>

              <span>
                {transaction.status}
              </span>

              <span>
                {new Date(
                  transaction.createdAt
                ).toLocaleString()}
              </span>
            </div>
          ))
        )}

      </div>

    </div>
  );
}
