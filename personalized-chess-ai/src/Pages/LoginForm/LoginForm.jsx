import React, { useState } from "react";
import "./LoginForm.css";
import { FaUser, FaLock } from "react-icons/fa";

const LoginForm = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [username, setUsername] = useState('')

  function handleSubmit(event) {
    event.preventDefault();
    if (!isLogin && password !== confirmPassword) {
      alert("Passwords don't match!");
      return;
    }
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
              <a href="#">Forgot password?</a>
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