import React from 'react';

const CustomAlert = ({ message, onClose }) => {
  return (
    <div className="custom-alert">
      <div className="alert-content">
        {typeof message === 'string' ? <p>{message}</p> : message}
        <button onClick={onClose} className="close-button">Close</button>
      </div>
    </div>
  );
};

export default CustomAlert; 