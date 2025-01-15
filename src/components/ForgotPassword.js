import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from './Header';
import LoadingScreen from './LoadingScreen';

const BASE_URL = process.env.REACT_APP_BASE_URL;

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [resetCode, setResetCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState(1);
    const navigate = useNavigate();
    const { t } = useTranslation();

    const handleRequestReset = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch(`${BASE_URL}/request-password-reset`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    email: email  // Make sure email is properly sent
                }),
            });

            const data = await response.json();
            console.log('Response:', data); // Add this for debugging

            if (response.ok) {
                setMessage(typeof data.message === 'string' ? data.message : t('reset_code_sent'));
                setStep(2);
            } else {
                setMessage(typeof data.detail === 'string' ? data.detail : t('reset_request_failed'));
            }
        } catch (error) {
            console.error('Error:', error);
            setMessage(t('error_occurred'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            console.log('Sending reset request with:', {  // Debug log
                email,
                reset_code: resetCode,
                new_password: newPassword
            });

            const response = await fetch(`${BASE_URL}/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    reset_code: resetCode,
                    new_password: newPassword
                }),
            });

            const data = await response.json();
            console.log('Reset response:', data);  // Debug log

            if (response.ok) {
                setMessage(typeof data.message === 'string' ? data.message : t('password_reset_success'));
                setTimeout(() => navigate('/login'), 2000);
            } else {
                setMessage(typeof data.detail === 'string' ? data.detail : t('password_reset_failed'));
            }
        } catch (error) {
            console.error('Reset error:', error);
            setMessage(t('error_occurred'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Header />
            <div className="forgot-password-container">
                {isLoading && <LoadingScreen />}
                <h2>{t('reset_password')}</h2>
                
                {step === 1 ? (
                    <form onSubmit={handleRequestReset}>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={t('enter_email')}
                            required
                        />
                        <button type="submit">{t('send_reset_code')}</button>
                    </form>
                ) : (
                    <form onSubmit={handleResetPassword}>
                        <input
                            type="text"
                            value={resetCode}
                            onChange={(e) => setResetCode(e.target.value)}
                            placeholder={t('enter_reset_code')}
                            required
                        />
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder={t('enter_new_password')}
                            required
                        />
                        <button type="submit">{t('reset_password')}</button>
                    </form>
                )}
                
                {message && <p className="message">{message}</p>}
            </div>
        </>
    );
}

export default ForgotPassword; 