import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../App.css'; // Ensure to import the CSS file for styling

const Home = () => {
  const { state } = useLocation();
  const [foodsId, setFoodsId] = useState(0);
  const [count, setCount] = useState('');
  const [foodCalories, setFoodCalories] = useState('');
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  });
  const [showForm, setShowForm] = useState(false);
  const [cameraIsOpen, setCameraIsOpen] = useState(false);
  const [imageDataUrl, setImageDataUrl] = useState(null);
  const videoElement = useRef(null);
  const streamRef = useRef(null);
  const navigate = useNavigate();
  const username = localStorage.getItem('username');
  const userId = localStorage.getItem('user_id');
  const requiredCalories = localStorage.getItem('requiredCalories');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      console.log(token);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user_id');
    localStorage.removeItem('access_token');
    localStorage.removeItem('username');
    sessionStorage.clear();
    console.log('Logged out, storage cleared');
    navigate('/login');
  };

  const goToIntakeTable = () => {
    console.log("Navigating to Intake Table with User ID:", userId);
    navigate(`/intake-table`, { state: { username, userId, requiredCalories } });
  };

  const startCamera = async () => {
    try {
      setCameraIsOpen(true);
      streamRef.current = await navigator.mediaDevices.getUserMedia({ video: true });
      videoElement.current.srcObject = streamRef.current;
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      setCameraIsOpen(false);
      streamRef.current.getTracks().forEach((track) => track.stop());
      videoElement.current.srcObject = null;
      streamRef.current = null;
    }
  };

  const takePhoto = () => {
    if (!streamRef.current) {
      console.error('Camera not started.');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = videoElement.current.videoWidth;
    canvas.height = videoElement.current.videoHeight;
    canvas.getContext('2d').drawImage(videoElement.current, 0, 0, canvas.width, canvas.height);

    const capturedImageDataUrl = canvas.toDataURL('image/png');
    setImageDataUrl(capturedImageDataUrl);

    const blobData = dataURLtoBlob(capturedImageDataUrl);

    const formData = new FormData();
    formData.append('image', blobData, 'captured-image.png');

    fetch('http://127.0.0.1:8000/save-image', {
      method: 'POST',
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        console.log('Image saved on server:', data.message);
      })
      .catch((error) => {
        console.error('Error saving image:', error);
      });
  };

  const handleUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('image', file);

      fetch('http://127.0.0.1:8000/upload_image/', {
        method: 'POST',
        body: formData,
      })
        .then((response) => response.json())
        .then((data) => {
          console.log('Image uploaded successfully:', data.message);
        })
        .catch((error) => {
          console.error('Error uploading image:', error);
        });
    }
  };

  const handleFormSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('foods_id', foodsId);
    formData.append('count', count);
    formData.append('food_calories', foodCalories);
    formData.append('date', date);
    fetch('http://127.0.0.1:8000/submit/', {
      method: 'POST',
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        console.log('Success:', data);
        setFoodsId(0); // Reset to default value
        setCount('');
        setFoodCalories('');
        setDate(() => {
          const today = new Date();
          return today.toISOString().split('T')[0];
        });
        setImageDataUrl(null);
        setShowForm(false);
        stopCamera();
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  };

  const dataURLtoBlob = (dataUrl) => {
    const byteString = atob(dataUrl.split(',')[1]);
    const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  };

  return (
    <div className="home-container">
      <div className="sidebar">
        <p className="welcome-message">Welcome, {username}</p>
        <ul className="menu-list">
          <li onClick={goToIntakeTable} className="menu-item">Intake Details</li>
          <li onClick={handleLogout} className="menu-item logout">Logout</li>
        </ul>
      </div>
      <div className="main-content">
        
        <div className="detect-food-section">
          <h3>Detect Food</h3>
          <div className="button-group">
            <button onClick={startCamera} className="primary-button">Capture Image</button>
            <input type="file" accept="image/*" onChange={handleUpload} className="file-input" />
            <button onClick={() => setShowForm(!showForm)} className="primary-button">
              {showForm ? 'Cancel' : 'Submit Intake Manually'}
            </button>
          </div>
        </div>

        {cameraIsOpen && (
          <div id="camera-section">
            <video ref={videoElement} autoPlay className="video-element"></video>
            <button onClick={takePhoto} className="primary-button">Take Photo</button>
            <button onClick={stopCamera} className="secondary-button">Close Camera</button>
          </div>
        )}

        {showForm && (
          <form onSubmit={handleFormSubmit} className="intake-form">
            <input
              type="number"
              id="user_id"
              name="user_id"
              required
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="hidden"
            />

            <input
              type="number"
              id="foods_id"
              name="foods_id"
              required
              value={foodsId}
              onChange={(e) => setFoodsId(e.target.value)}
              className="hidden"
            />

            <label htmlFor="count">Amount of food in grams:</label>
            <input
              type="number"
              step="0.01"
              id="count"
              name="count"
              required
              value={count}
              onChange={(e) => setCount(e.target.value)}
            />

            <label htmlFor="food_calories">Cal/g:</label>
            <input
              type="number"
              step="0.01"
              id="food_calories"
              name="food_calories"
              required
              value={foodCalories}
              onChange={(e) => setFoodCalories(e.target.value)}
            />

            <label htmlFor="date">Date (YYYY-MM-DD):</label>
            <input
              type="date"
              id="date"
              name="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />

            <input type="submit" value="Submit" className="primary-button" />
          </form>
        )}
      </div>
    </div>
  );
};

export default Home;


