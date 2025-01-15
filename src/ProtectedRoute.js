// ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('access_token'); // or use a token management library
  
  return token ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;
