import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import LoadingScreen from './LoadingScreen';
import '../App.css';
import { useTranslation } from 'react-i18next';

const BASE_URL = String(process.env.REACT_APP_BASE_URL);

const Signup = () => {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [gender, setGender] = useState('Male');
  const [activity, setActivity] = useState('No Exercise');
  const [goal, setGoal] = useState('maintain weight');
  const [requiredCalories, setRequiredCalories] = useState(0);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const calculateRequiredCalories = (weight, height, age, gender, activity, goal) => {
    let BMR;
    if (gender === 'Male') {
      BMR = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      BMR = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    const activityLevels = {
      'No Exercise': 1.2,
      'Once a week': 1.4,
      '2-3 times per week': 1.6,
      '4-5 times per week': 1.8,
    };

    const activityFactor = activityLevels[activity] || 1;
    let dailyCalories = BMR * activityFactor;

    if (goal === 'lose weight') {
      dailyCalories *= 0.8;
    } else if (goal === 'gain weight') {
      dailyCalories += 500;
    }

    return dailyCalories;
  };

  const calculateAge = (birthdate) => {
    const birthDate = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);

    const age = calculateAge(birthdate);
    const calculatedCalories = calculateRequiredCalories(weight, height, age, gender, activity, goal);
    setRequiredCalories(calculatedCalories);

    const userData = {
      username,
      password,
      email,
      birthdate,
      age,
      weight,
      height,
      gender,
      activity,
      goal,
      requiredCalories: calculatedCalories,
    };

    fetch(`${BASE_URL}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setMessage(t('redirecting_login'));
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        } else {
          setMessage(data.message || t('email_exists'));
        }
      })
      .catch((error) => {
        console.error('Error registering user:', error);
        setMessage(t('registration_error'));
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <>
      {isLoading && <LoadingScreen />}
      <div className="signup-container">
        <form onSubmit={handleSubmit} className="signup-form">
          <h2>{t('signup')}</h2>

          <label>{t('username')}</label>
          <input 
            type="text" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            placeholder={t('enter_username')}
            required 
          />

          <label>{t('password')}</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            placeholder={t('enter_password')}
            required 
          />

          <label>{t('email')}</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder={t('enter_email')}
            required 
          />

          <label>{t('date')}</label>
          <input 
            type="date" 
            value={birthdate} 
            onChange={(e) => setBirthdate(e.target.value)} 
            required 
          />

          <label>{t('weight_kg')}</label>
          <input 
            type="number" 
            value={weight} 
            onChange={(e) => setWeight(e.target.value)} 
            placeholder={t('enter_weight')}
            required 
          />

          <label>{t('height')}</label>
          <input 
            type="number" 
            value={height} 
            onChange={(e) => setHeight(e.target.value)} 
            placeholder={t('enter_height')}
            required 
          />

          <label>{t('gender')}</label>
          <select value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="Male">{t('male')}</option>
            <option value="Female">{t('female')}</option>
          </select>

          <label>{t('activity_level')}</label>
          <select value={activity} onChange={(e) => setActivity(e.target.value)}>
            <option value="No Exercise">{t('no_exercise')}</option>
            <option value="Once a week">{t('once_week')}</option>
            <option value="2-3 time per week">{t('twice_week')}</option>
            <option value="4-5 times a week">{t('four_times_week')}</option>
          </select>

          <label>{t('goal')}</label>
          <select value={goal} onChange={(e) => setGoal(e.target.value)}>
            <option value="maintain weight">{t('maintain_weight')}</option>
            <option value="lose weight">{t('lose_weight')}</option>
            <option value="gain weight">{t('gain_weight')}</option>
          </select>

          <button type="submit" className="signup-button">{t('signup')}</button>
        </form>
        <p className="signup-message">{message}</p>
        <p className="login-link">
          {t('already_have_account')} <Link to="/login">{t('login_here')}</Link>
        </p>
      </div>
    </>
  );
};

export default Signup;
