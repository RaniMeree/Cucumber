import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingScreen from './LoadingScreen';
import Header from './Header';
import '../App.css';

const BASE_URL = process.env.REACT_APP_BASE_URL;

const Verification = () => {
    const [verificationCode, setVerificationCode] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const email = localStorage.getItem('tempEmail');

    useEffect(() => {
        // Redirect if no email is stored
        if (!email) {
            navigate('/signup');
        }
    }, [email, navigate]);

    const handleVerification = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        
        console.log('=== Starting Verification Process ===');
        console.log('Email:', email);
        console.log('Verification code entered:', verificationCode);

        try {
            console.log('Sending verification request to:', `${BASE_URL}/verify-code`);
            const response = await fetch(`${BASE_URL}/verify-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({
                    email: email,
                    code: verificationCode
                })
            });

            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Response data:', data);

            if (!response.ok) {
                throw new Error(data.detail || data.message || 'Verification failed');
            }

            console.log('✅ Verification successful!');
            setMessage('Account verified successfully!');
            localStorage.removeItem('tempEmail'); // Clean up
            setTimeout(() => navigate('/login'), 2000);

        } catch (error) {
            console.error('❌ Verification error:', error);
            setMessage(error.message || 'Verification failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {isLoading && <LoadingScreen />}
            <Header />
            <div className="verification-container">
                <form onSubmit={handleVerification} className="verification-form">
                    <h2>Verify Your Email</h2>
                    <p>Please enter the verification code sent to {email}</p>
                    <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        placeholder="Enter verification code"
                        required
                    />
                    <button type="submit">Verify</button>
                </form>
                <p className="verification-message">{message}</p>
            </div>
        </>
    );
};

export default Verification; 