import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import LoadingScreen from './LoadingScreen';
import Header from './Header';
import '../App.css';
import { useTranslation } from 'react-i18next';

const BASE_URL = process.env.REACT_APP_BASE_URL;
if (!BASE_URL) {
  console.error('REACT_APP_BASE_URL is not defined in environment variables');
}

console.log('Original BASE_URL:', BASE_URL);

const customFetch = (url, options = {}) => {
    return fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            'ngrok-skip-browser-warning': 'true'
        }
    });
};

function Login() {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationStep, setVerificationStep] = useState('login');
  const [tempEmail, setTempEmail] = useState('');

  const handleVerification = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/verify-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: tempEmail,
          code: verificationCode
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      setMessage('Email verified successfully!');
      setTimeout(() => navigate('/login'), 2000);

    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/resend-verification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true"
        },
        body: JSON.stringify({ email: username }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Failed to resend code");
      }
      setMessage(data.message || "Verification code resent");
    } catch (error) {
      setMessage(error.message || "Error resending verification code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(t("logging_in"));

    try {
        const loginUrl = new URL('/token', BASE_URL).toString();
        console.log('1. Login URL:', loginUrl);
        console.log('2. Sending login request with username:', username);

        // Log the request details
        console.log('3. Request details:', {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json",
                "ngrok-skip-browser-warning": "true",
                "Origin": window.location.origin
            },
            credentials: 'include',
            mode: 'cors',
            body: new URLSearchParams({
                username: username,
                password: password,
                grant_type: "password"
            }).toString()
        });

        console.log('4. Starting fetch request...');
        const response = await fetch(loginUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json",
                "ngrok-skip-browser-warning": "true",
                "Origin": window.location.origin
            },
            credentials: 'include',
            mode: 'cors',
            body: new URLSearchParams({
                username: username,
                password: password,
                grant_type: "password"
            }).toString(),
        });
        console.log('5. Fetch request completed');
        console.log('6. Response status:', response.status);

        const rawResponse = await response.text();
        console.log('7. Raw response:', rawResponse);

        let data;
        try {
            data = JSON.parse(rawResponse);
            console.log('8. Parsed data:', data);
        } catch (parseError) {
            console.error('9. Failed to parse response:', parseError);
            setMessage(t("parse_error", { error: rawResponse.substring(0, 100) }));
            return;
        }

        if (response.status === 403 && data.detail.includes("Email not verified")) {
            setTempEmail(username);
            await handleResendCode();
            localStorage.setItem('tempEmail', username);
            navigate('/verification');
            return;
        }

        if (response.ok && data.access_token) {
            setMessage(t("login_successful"));
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('user_id', data.user_id);
            localStorage.setItem('username', data.username);
            
            setTimeout(() => {
                navigate("/home");
            }, 100);
        } else {
            setMessage(data.detail || t("invalid_response"));
        }
    } catch (error) {
        console.error('Login error:', error);
        setMessage(t("login_failed", { error: error.message }));
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <>
      {isLoading && <LoadingScreen />}
      <Header />
      <div className="login-container">
        {verificationStep === 'login' ? (
          <>
            <h2>{t("login")}</h2>
            <form onSubmit={handleLogin} className="login-form">
              <input
                type="email"
                placeholder={t("Enter your email")}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="login-input"
                required
                autoComplete="username"
              />
              <input
                type="password"
                placeholder={t("Enter your password")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-input"
                required
                autoComplete="current-password"
              />
              <button type="submit" className="login-button">{t("login")}</button>
            </form>
            <p className="signup-link">
              {t("dont_have_account")} <Link to="/signup">{t("signup_here")}</Link>
            </p>
            <p className="forgot-password-link">
              <Link to="/forgot-password">{t('Forgot your password')}</Link>
            </p>
          </>
        ) : (
          <form onSubmit={handleVerification} className="verification-form">
            <h2>Verify Your Email</h2>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="Enter verification code"
              required
            />
            <button type="submit">Verify</button>
            
            
          </form>
        )}
        {message && <p className="login-message">{message}</p>}

        
      </div>
    </>
  );
}

export default Login;
