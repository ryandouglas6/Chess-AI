import React, { useState } from "react";
import "./LoginForm.css";
import { FaUser, FaLock} from "react-icons/fa";

const LoginForm = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  function handleSubmit(event) {
    event.preventDefault();

  }

  return (
    <div className="login-container">
      <img src="ChessLogo.jpg" alt="Chess Logo" className="chess-logo" />
      <h2 className="title">Sign in to Movemate</h2>
      <div className="wrapper">
        <form onSubmit={handleSubmit}>
          <div className="input-box">
            <input type="text" placeholder="Email" required 
            onChange={e => setEmail(e.target.value)}/>
            <FaUser className="icon" />
          </div>
          <div className="input-box">
            <input type="password" placeholder="Password" required 
            onChange={e => setPassword(e.target.value)}/>
            <FaLock className="icon" />
          </div>
          <div className="remember-forgot">
            <label>
              <input type="checkbox" />
              Remember me
            </label>
            <a href="#">Forgot password?</a>
          </div>
          <button type="submit">Login</button>
          <div className="register-link">
            <p>
              Don't have an account? <a href="#">Register</a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
