import React from 'react';
import CalorieProgress from './CalorieProgress';

const YourParentComponent = () => {
    // Example values - replace with your actual data
    const calorieLimit = 2000;
    const consumedCalories = 500;

    return (
        <div>
            <CalorieProgress 
                calorieLimit={calorieLimit}
                consumedCalories={consumedCalories}
            />
        </div>
    );
};

export default YourParentComponent; 