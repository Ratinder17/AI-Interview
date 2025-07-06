import React, { useState } from "react";
import LoginForm from "./components/Login";
import RegisterForm from "./components/Register";

const App = () => {
  const [showRegister, setShowRegister] = useState(false);

  return (
    <div style={styles.container}>
      <h1>Welcome to AI Interview App</h1>

      {showRegister ? <RegisterForm /> : <LoginForm />}

      <button
        onClick={() => setShowRegister(!showRegister)}
        style={styles.toggleButton}
      >
        {showRegister
          ? "Already have an account? Login"
          : "Don't have an account? Register"}
      </button>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "400px",
    margin: "0 auto",
    textAlign: "center",
    padding: "2rem",
    fontFamily: "Arial, sans-serif",
  },
  toggleButton: {
    marginTop: "1rem",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    padding: "0.5rem 1rem",
    cursor: "pointer",
    borderRadius: "5px",
  },
};

export default App;
