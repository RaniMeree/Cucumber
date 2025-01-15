import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
const BASE_URL = "https://d24b-78-71-33-99.ngrok-free.app";

const UpdateProfile = ({ userId }) => {
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [activity, setActivity] = useState('No Exercise');
  const [goal, setGoal] = useState('maintain weight');
  const [requiredCalories, setRequiredCalories] = useState(0);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch current user data to pre-fill the form
    fetch(`${BASE_URL}/user/${userId}`)
      .then(response => response.json())
      .then(data => {
        setWeight(data.weight);
        setHeight(data.height);
        setActivity(data.activity);
        setGoal(data.goal);
        setRequiredCalories(data.requiredCalories);
      })
      .catch(error => console.error('Error fetching user data:', error));
  }, [userId]);

  const calculateRequiredCalories = (weight, height, activity, goal) => {
    const gender = 'Male';
    const age = 30;

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

  const handleSubmit = (e) => {
    e.preventDefault();

    const calculatedCalories = calculateRequiredCalories(weight, height, activity, goal);
    setRequiredCalories(calculatedCalories);

    const updatedData = {
      weight,
      height,
      activity,
      goal,
      requiredCalories: calculatedCalories,
    };

    fetch(`${BASE_URL}/user/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedData),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setMessage('Profile updated successfully!');
          setTimeout(() => {
            navigate('/profile');
          }, 2000); // Redirect after 2 seconds
        } else {
          setMessage(data.message || 'Error updating profile. Please try again.');
        }
      })
      .catch((error) => {
        console.error('Error updating user:', error);
        setMessage('An error occurred during update. Please try again.');
      });
  };

  return (
    <div className="update-profile-container">
      <form onSubmit={handleSubmit} className="update-profile-form">
        <h2>Update Profile</h2>

        <label>Weight (kg)</label>
        <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} required />

        <label>Height (cm)</label>
        <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} required />

        <label>Activity Level</label>
        <select value={activity} onChange={(e) => setActivity(e.target.value)}>
          <option value="No Exercise">No Exercise</option>
          <option value="Once a week">Once a week</option>
          <option value="2-3 times per week">2-3 times per week</option>
          <option value="4-5 times per week">4-5 times per week</option>
        </select>

        <label>Goal</label>
        <select value={goal} onChange={(e) => setGoal(e.target.value)}>
          <option value="maintain weight">Maintain weight</option>
          <option value="lose weight">Lose weight</option>
          <option value="gain weight">Gain weight</option>
        </select>

        <button type="submit" className="update-button">Update</button>
      </form>
      <p className="update-message">{message}</p>
    </div>
  );
};

export default UpdateProfile; 