import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

const BASE_URL = String(process.env.REACT_APP_BASE_URL);

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true'
  },
  withCredentials: false
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  error => Promise.reject(error)
);

const UserProfile = () => {
  const { t } = useTranslation();
  const [weight, setWeight] = useState('');
  const [activity, setActivity] = useState('No Exercise');
  const [goal, setGoal] = useState('maintain weight');
  const [message, setMessage] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      const userId = localStorage.getItem('user_id');
      if (!userId) {
        setMessage(t('no_user_id'));
        return;
      }

      try {
        const response = await api.get(`/get_user/${userId}`);
        setWeight(response.data.weight || '');
        setActivity(response.data.activity || 'No Exercise');
        setGoal(response.data.goal || 'maintain weight');
        setHeight(response.data.height || '');
        setAge(response.data.age || '');
      } catch (error) {
        setMessage(t('error_loading_profile'));
      }
    };

    fetchUserData();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    const userId = localStorage.getItem('user_id');

    try {
      const response = await api.put(`/update_user/${userId}`, {
        weight: parseFloat(weight),
        activity,
        goal
      });

      setMessage(t('profile_updated'));
      localStorage.setItem('requiredCalories', response.data.requiredCalories);

      setTimeout(() => {
        window.location.href = '/home';
      }, 2000);

    } catch (error) {
      setMessage(`${t('update_failed')}: ${error.response?.data?.detail || error.message}`);
    }
  };

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '20px',
      margin: '20px auto',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      maxWidth: '320px'
    }}>
      <h3 style={{ 
        margin: '0 0 20px 0', 
        fontSize: '20px',
        textAlign: 'center' 
      }}>
        {t('update_profile')}
      </h3>

      <form onSubmit={handleUpdate}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            color: '#666',
            marginBottom: '8px'
          }}>
            {t('weight_kg')}
          </label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              backgroundColor: '#f5f5f5'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            color: '#666',
            marginBottom: '8px'
          }}>
            {t('activity_level')}
          </label>
          <select
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              backgroundColor: '#f5f5f5',
              appearance: 'none'
            }}
          >
            <option value="No Exercise">{t('no_exercise')}</option>
            <option value="Once a week">{t('once_week')}</option>
            <option value="2-3 time per week">{t('twice_week')}</option>
            <option value="4-5 times a week">{t('four_times_week')}</option>
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            color: '#666',
            marginBottom: '8px'
          }}>
            {t('goal')}
          </label>
          <select
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              backgroundColor: '#f5f5f5',
              appearance: 'none'
            }}
          >
            <option value="maintain weight">{t('maintain_weight')}</option>
            <option value="lose weight">{t('lose_weight')}</option>
            <option value="gain weight">{t('gain_weight')}</option>
          </select>
        </div>

        <button 
          type="submit"
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: '#34C759',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          {t('update')}
        </button>
      </form>
      {message && <p className="update-message">{message}</p>}
    </div>
  );
};

export default UserProfile; 