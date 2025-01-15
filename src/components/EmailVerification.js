import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import LoadingScreen from './LoadingScreen';
import Header from './Header';
import { useTranslation } from 'react-i18next';

const BASE_URL = process.env.REACT_APP_BASE_URL;

function EmailVerification() {
  const [verificationCode, setVerificationCode] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const tempEmail = location.state?.tempEmail;
  const { t } = useTranslation();

  const handleVerification = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: tempEmail,
          code: verificationCode
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(t('email_verified'));
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setMessage(data.detail || t('verification_failed'));
      }
    } catch (error) {
      setMessage(t('verification_error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="verification-container">
        {isLoading && <LoadingScreen />}
        <h2>{t('verify_your_email')}</h2>
        <form onSubmit={handleVerification} className="verification-form">
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder={t('enter_verification_code')}
            required
          />
          <button type="submit">{t('verify')}</button>
        </form>
        <p>{message || t('please_check_your_email')}</p>
        <p>
          {t('already_have_account')} <Link to="/login">{t('login_here')}</Link>
        </p>
        {message && <p className="verification-message">{message}</p>}
      </div>
    </>
  );
};

export default EmailVerification; 