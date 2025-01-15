import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Home from './components/Home';
import Signup from './components/Signup';
import IntakeTable from './components/IntakeTable';
import ProtectedRoute from './ProtectedRoute';
import Profile from './components/Profile';
import UpdateProfile from './components/UpdateProfile';
import EmailVerification from './components/EmailVerification';
import Verification from './components/Verification';
import ForgotPassword from './components/ForgotPassword';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Navigate to="/home" />} />
          <Route path="/login" element={<Login />} /> {/* Login Page */}
          <Route path="/signup" element={<Signup />} /> {/* Signup Page */}
          {/* Protected Home Route */}
          <Route 
            path="/home" 
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } 
          />
          {/* Intake Table */}
          <Route path="/intake-table" element={<IntakeTable />} /> {/* Intake Table */}
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:userId" element={<UpdateProfile />} />
          <Route path="/verify-email" element={<EmailVerification />} />
          <Route path="/emailverification" element={<EmailVerification />} />
          <Route path="/email-verification" element={<EmailVerification />} />
          <Route path="/verification" element={<Verification />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
