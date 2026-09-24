import { useState } from "react";
import { Login, Dashboard } from "./pages";
import { Header } from "./components";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(
    Boolean(localStorage.getItem("token"))
  );

  return (
    <>
      <Header />

      {loggedIn ? (
        <Dashboard />
      ) : (
        <Login onLogin={() => setLoggedIn(true)} />
      )}
    </>
  );
}