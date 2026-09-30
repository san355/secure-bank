import { useState } from "react";
import {
  Login,
  Register,
  Dashboard
} from "./pages";

export default function App() {

  const [page, setPage] = useState(
    localStorage.getItem("token")
      ? "dashboard"
      : "login"
  );

  if (page === "dashboard") {
    return <Dashboard />;
  }

  if (page === "register") {
    return (
      <Register
        onLogin={() => setPage("login")}
      />
    );
  }

  return (
    <Login
      onLogin={() => setPage("dashboard")}
      onRegister={() => setPage("register")}
    />
  );
}
