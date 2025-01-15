// Create a new component: src/components/LoadingScreen.js
import React from 'react';
import logo from '../assets/logo.jpg';
import '../App.css';  // Make sure to import the CSS

const LoadingScreen = () => {
  return (
    <div className="loading-screen">
      <img src={logo} alt="Logo" className="animated-logo" />
    </div>
  );
};

export default LoadingScreen;  // Don't forget to export