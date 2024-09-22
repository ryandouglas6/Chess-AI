import React from "react";
import "./LoginForm.css";
import { FaUser, FaLock} from "react-icons/fa";

const LoginForm = () => {
  return (
    <div className="login-container">
      <img src="ChessLogo.jpg" alt="Chess Logo" className="chess-logo" />
      <h2 className="title">Sign in to Movemate</h2>
      <div className="wrapper">
        <form action="">
          <div className="input-box">
            <input type="text" placeholder="Email" required />
            <FaUser className="icon" />
          </div>
          <div className="input-box">
            <input type="password" placeholder="Password" required />
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
