import React, { useState } from "react";
import "./LoginForm.css";
import { FaUser, FaLock } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    if (!isLogin && password !== confirmPassword) {
      alert("Passwords don't match!");
      return;
    }
    // Register
    else if (!isLogin) {
      try {
        const response = await fetch("https://movemate.database.windows.net/create-account", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            email,
            password,
          }),
        });

        // Handle the response
        if (response.ok) {
          const result = await response.json();
          alert(result.message);
          setIsLogin(true);

          // handle redirect
        } else {
          const errorData = await response.json();
          alert(`Error: ${errorData.error}`);
        }
      } catch (error) {
        console.error("Error creating account:", error);
        alert("Failed to create account. Please try again later.");
      }
    }
    // Login
    else if (isLogin) {
      try {
        const response = await fetch("https://movemate.database.windows.net/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            password,
          }),
        });

        // Handle the response
        if (response.ok) {
          const result = await response.json();
          alert(result.message);

          // handle valid response / redirect (WIP)
          console.log("Login successful");
        } else {
          const errorData = await response.json();
          alert(`Error: ${errorData.error}`);
        }
      } catch (error) {
        console.error("Error logging in:", error);
        alert("Failed to login. Please try again later.");
      }
    }
  }

  const handleForgotPassword = (e) => {
    e.preventDefault();
    setIsForgotPassword(true);
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    // Here you would typically make an API call to your backend
    // to handle the password reset request
    try {
      // Simulating API call
      console.log("Password reset requested for:", resetEmail);
      setResetSent(true);
      // Reset form after 3 seconds and go back to login
      setTimeout(() => {
        setResetSent(false);
        setIsForgotPassword(false);
        setResetEmail('');
      }, 3000);
    } catch (error) {
      console.error("Error requesting password reset:", error);
      alert("Failed to request password reset. Please try again.");
    }
  };

  const handleBackToLogin = (e) => {
    e.preventDefault();
    setIsForgotPassword(false);
    setResetEmail('');
    setResetSent(false);
  };

  if (isForgotPassword) {
    return (
      <div className="login-container">
        <img src="ChessLogo.jpg" alt="Chess Logo" className="chess-logo" />
        <h2 className="title">Reset Password</h2>
        <div className="wrapper">
          <form onSubmit={handleResetSubmit}>
            {!resetSent ? (
              <>
                <div className="input-box">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    required
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                  />
                  <FaUser className="icon" />
                </div>
                <button type="submit">Send Reset Link</button>
              </>
            ) : (
              <div className="reset-success">
                <p>Password reset link has been sent to your email!</p>
              </div>
            )}
            <div className="register-link">
              <p>
                <a href="#" onClick={handleBackToLogin}>Back to Login</a>
              </p>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <img src="ChessLogo.jpg" alt="Chess Logo" className="chess-logo" />

      <h2 className="title">{isLogin ? "Sign in to Movemate" : "Create Account"}</h2>
      <div className="wrapper">
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="input-box">
              <input
                type="text"
                placeholder="Username"
                required
                onChange={e => setUsername(e.target.value)}
              />
              <FaUser className="icon" />
            </div>
          )}
          <div className="input-box">
            <input
              type="text"
              placeholder="Email"
              required
              onChange={e => setEmail(e.target.value)}
            />
            <FaUser className="icon" />
          </div>
          <div className="input-box">
            <input
              type="password"
              placeholder="Password"
              required
              onChange={e => setPassword(e.target.value)}
            />
            <FaLock className="icon" />
          </div>
          {!isLogin && (
            <div className="input-box">
              <input
                type="password"
                placeholder="Confirm Password"
                required
                onChange={e => setConfirmPassword(e.target.value)}
              />
              <FaLock className="icon" />
            </div>
          )}
          {isLogin && (
            <div className="remember-forgot">
              <label>
                <input type="checkbox" />
                Remember me
              </label>
              <a href="#" onClick={handleForgotPassword}>Forgot password?</a>
            </div>
          )}
          <button type="submit">{isLogin ? "Login" : "Register"}</button>
          <div className="register-link">
            <p>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <a href="#" onClick={() => setIsLogin(!isLogin)}>
                {isLogin ? "Register" : "Login"}
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
