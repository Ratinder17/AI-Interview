import React, { useState } from "react";
import Login from "./components/Login";
import Register from "./components/Register";
import "./App.css";

function App() {
  const [showLogin, setShowLogin] = useState(true);

  return (
    <div className="app-container">
      <div className="top-left-title">Botterviewer</div>
      {showLogin ? (
        <>
          <Login />
          <p className="switch-form-text">
            <span>Don't have an account? </span>
            <button onClick={() => setShowLogin(false)}>Register here</button>
          </p>
        </>
      ) : (
        <>
          <Register />
          <p className="switch-form-text">
            <span>Already have an account? </span>
            <button onClick={() => setShowLogin(true)}>Login here</button>
          </p>
        </>
      )}
    </div>
  );
}

export default App;
