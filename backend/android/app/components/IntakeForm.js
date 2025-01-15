import React, { useState } from 'react';

const IntakeForm = ({ foodName, calculatedCalories, onAddIntake }) => {
  const [amount, setAmount] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!amount) {
      alert('Please enter the amount.');
      return;
    }
    onAddIntake({ foodName, calculatedCalories, amount });
    setAmount(''); // Reset the form
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px' }}>
      <div>
        <label>Food Name:</label>
        <input type="text" value={foodName} readOnly />
      </div>
      <div>
        <label>Calories per Gram:</label>
        <input type="number" value={calculatedCalories} readOnly />
      </div>
      <div>
        <label>Amount Consumed:</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          min="1"
          step="1"
        />
      </div>
      <button type="submit">Add Food</button>
    </form>
  );
};

export default IntakeForm; 