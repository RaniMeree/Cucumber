import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import LoadingScreen from './LoadingScreen';
import '../App.css';

const BASE_URL = process.env.REACT_APP_BASE_URL;
if (!BASE_URL) {
  console.error('REACT_APP_BASE_URL is not defined in environment variables');
}

console.log('Original BASE_URL:', BASE_URL);

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("Logging in...");

    try {
      const loginUrl = new URL('/token', BASE_URL).toString();
      console.log('Login URL:', loginUrl);

      const response = await fetch(loginUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "application/json"
        },
        body: new URLSearchParams({
          username: username,
          password: password,
          grant_type: "password"
        }).toString(),
        mode: 'cors',
        credentials: 'include'
      });

      const rawResponse = await response.text();
      console.log('Raw response:', rawResponse);

      let data;
      try {
        data = JSON.parse(rawResponse);
      } catch (error) {
        console.error('Failed to parse response:', error);
        setMessage("Server response was not in the expected format");
        return;
      }

      console.log('Login response data:', data);

      if (response.ok) {
        setMessage("Login successful!");

        if (data.user_id) {
          localStorage.setItem('user_id', data.user_id);
          localStorage.setItem('access_token', data.access_token);
          localStorage.setItem('username', data.username);
          if (data.requiredCalories) {
            localStorage.setItem('requiredCalories', data.requiredCalories);
          }
          
          navigate("/home");
        } else {
          console.warn('User ID is not available in the response.');
          setMessage("Login successful but user data is incomplete");
        }
      } else {
        setMessage(data.detail || "Error logging in");
      }
    } catch (error) {
      console.error('Login error:', error);
      setMessage("An error occurred during login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isLoading && <LoadingScreen />}
      <div className="login-container">
        <h2>Login</h2>
        <form onSubmit={handleLogin} className="login-form">
          <input
            type="email"
            placeholder="Email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="login-input"
            required
            autoComplete="username"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
            required
            autoComplete="current-password"
          />
          <button type="submit" className="login-button">Login</button>
        </form>
        {message && <p className="login-message">{message}</p>}
        <p className="signup-link">
          Don't have an account? <Link to="/signup">Sign up here.</Link>
        </p>
      </div>
    </>
  );
}

export default Login;
