import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Calendar from 'react-calendar';
import CalorieProgress from './CalorieProgress';
import axios from 'axios';

const NutritionCalendar = ({ userId, onHealthScoreUpdate }) => {
  const { t } = useTranslation();
  const [calendarNutrient, setCalendarNutrient] = useState('calories');
  const [intakeData, setIntakeData] = useState([]);
  const [requiredCaloriesData, setRequiredCaloriesData] = useState([]);
  const [userCalories, setUserCalories] = useState(0);
  const [error, setError] = useState(null);
  const [dailyScores, setDailyScores] = useState({});
  const [currentView, setCurrentView] = useState({
    month: new Date().getMonth(),
    year: new Date().getFullYear()
  });

  const axiosConfig = {
    headers: {
      'ngrok-skip-browser-warning': 'true',
      'Content-Type': 'application/json'
    }
  };

  const BASE_URL = String(process.env.REACT_APP_BASE_URL);

  useEffect(() => {
    if (!userId) return;

    // Fetch all required data
    Promise.all([
      axios.get(`${BASE_URL}/intake/${userId}`, axiosConfig),
      axios.get(`${BASE_URL}/daily_user_stats/${userId}`, axiosConfig),
      axios.get(`${BASE_URL}/get_user/${userId}`, axiosConfig)
    ]).then(([intakeRes, statsRes, userRes]) => {
      setIntakeData(intakeRes.data.intake || []);
      setRequiredCaloriesData(statsRes.data || []);
      setUserCalories(userRes.data.calories);
    }).catch(error => {
      console.error('Error fetching data:', error);
      setError("Failed to fetch data");
    });
  }, [userId]);

  useEffect(() => {
    if (intakeData.length > 0) {
      // Only calculate score for the currently viewed month, not the current month
      const score = calculateMonthlyHealthScore(
        currentView.month,
        currentView.year
      );
      onHealthScoreUpdate(score);
    }
  }, [intakeData, currentView, onHealthScoreUpdate]);

  const getRequiredCalories = (date) => {
    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);

    if (requiredCaloriesData.length === 0) {
      return userCalories;
    }

    const sortedRecords = requiredCaloriesData.sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
    
    let lastRequiredCalories = userCalories;

    for (const record of sortedRecords) {
      const recordDate = new Date(record.date);
      recordDate.setHours(0, 0, 0, 0);

      if (dateObj >= recordDate) {
        lastRequiredCalories = record.required_calories;
      } else {
        break;
      }
    }

    return lastRequiredCalories;
  };

  const getNutrientPercentage = (date, nutrientType) => {
    // Create date at UTC midnight
    const targetDate = new Date(Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    ));

    // Filter records for this date, also using UTC
    const dayData = intakeData.filter(record => {
      const recordDate = new Date(record.date);
      const recordUTC = new Date(Date.UTC(
        recordDate.getFullYear(),
        recordDate.getMonth(),
        recordDate.getDate()
      ));
      
      return targetDate.getTime() === recordUTC.getTime();
    });

    const requiredCalories = getRequiredCalories(targetDate);

    switch (nutrientType) {
      case 'calories':
        const totalCalories = dayData.reduce((sum, record) => 
          sum + (record.count * record.food_calories), 0
        );
        return (totalCalories / requiredCalories) * 100;
      case 'protein':
        const totalProtein = dayData.reduce((sum, record) => 
          sum + (record.count * record.food_protein), 0
        );
        return (totalProtein / ((requiredCalories * 0.3) / 4)) * 100;
      case 'fats':
        const totalFats = dayData.reduce((sum, record) => 
          sum + (record.count * record.food_fats), 0
        );
        return (totalFats / ((requiredCalories * 0.25) / 9)) * 100;
      case 'carbs':
        const totalCarbs = dayData.reduce((sum, record) => 
          sum + (record.count * record.food_carbs), 0
        );
        return (totalCarbs / ((requiredCalories * 0.45) / 4)) * 100;
      default:
        return 0;
    }
  };

  const calculateNutrientScore = (percentage) => {
    if (!percentage || isNaN(percentage)) {
      console.log(`Invalid percentage: ${percentage}, returning 0`);
      return 0;
    }
    
    // Convert to absolute number
    percentage = Math.abs(percentage);
    console.log(`\nCalculating score for percentage: ${percentage.toFixed(1)}%`);
    
    // Calculate deviation from 100%
    const deviation = Math.abs(100 - percentage);
    
    // Score is 100 minus the deviation
    const score = Math.max(0, 100 - deviation);
    
    console.log(`Deviation from 100%: ${deviation.toFixed(1)}%`);
    console.log(`Score: ${score.toFixed(1)}/100`);
    
    return score;
  };

  const calculateMonthlyHealthScore = (month, year) => {
    console.log(`\n=== Calculating Health Score for ${new Date(year, month).toLocaleString('default', { month: 'long' })} ${year} ===`);
    
    // Get current date to limit calculations
    const now = new Date();
    const isCurrentMonth = now.getMonth() === month && now.getFullYear() === year;
    const lastDay = isCurrentMonth ? now.getDate() : new Date(year, month + 1, 0).getDate();
    
    console.log(`Calculating up to day: ${lastDay}`);
    
    let totalDaysWithData = 0;
    let weightedScores = {
      calories: { total: 0, weight: 0.4 },  // 40% weight
      protein: { total: 0, weight: 0.3 },   // 30% weight
      carbs: { total: 0, weight: 0.15 },    // 15% weight
      fats: { total: 0, weight: 0.15 }      // 15% weight
    };

    // Calculate scores for each day
    for (let day = 1; day <= lastDay; day++) {
      const date = new Date(year, month, day);
      const hasData = intakeData.some(record => {
        const recordDate = new Date(record.date);
        return recordDate.getDate() === day && 
               recordDate.getMonth() === month && 
               recordDate.getFullYear() === year;
      });

      if (hasData) {
        console.log(`\nDay ${day}:`);
        totalDaysWithData++;
        
        Object.keys(weightedScores).forEach(nutrient => {
          const percentage = getNutrientPercentage(date, nutrient);
          const score = calculateNutrientScore(percentage);
          weightedScores[nutrient].total += score;
          console.log(`${nutrient.charAt(0).toUpperCase() + nutrient.slice(1)}:`);
          console.log(`  Percentage: ${percentage.toFixed(1)}%`);
          console.log(`  Score: ${score.toFixed(1)}/100`);
        });
      }
    }

    console.log(`\nTotal days with data: ${totalDaysWithData}`);
    
    if (totalDaysWithData === 0) {
      console.log('No data available for this month, returning 0');
      return 0;
    }

    console.log('\nFinal Calculations:');
    let finalScore = 0;
    Object.entries(weightedScores).forEach(([nutrient, { total, weight }]) => {
      const averageScore = total / totalDaysWithData;
      const weightedScore = averageScore * weight;
      finalScore += weightedScore;
      
      console.log(`${nutrient.charAt(0).toUpperCase() + nutrient.slice(1)}:`);
      console.log(`  Average Score: ${averageScore.toFixed(1)}/100`);
      console.log(`  Weight: ${(weight * 100).toFixed(0)}%`);
      console.log(`  Weighted Score: ${weightedScore.toFixed(1)}`);
    });

    // Scale final score to 1-10 range
    const scaledScore = Math.round(finalScore / 10 * 10) / 10;
    console.log(`\nFinal Health Score: ${scaledScore.toFixed(1)}/10`);
    return scaledScore;
  };

  const getHealthScore = () => {
    const today = new Date();
    console.log('\n=== Starting Health Score Calculation ===');
    console.log(`Current Date: ${today.toLocaleDateString()}`);
    return calculateMonthlyHealthScore(today.getMonth(), today.getFullYear());
  };

  const calculateDailyScore = async (date) => {
    const scores = {
      calories: calculateNutrientScore(getNutrientPercentage(date, 'calories')),
      protein: calculateNutrientScore(getNutrientPercentage(date, 'protein')),
      carbs: calculateNutrientScore(getNutrientPercentage(date, 'carbs')),
      fats: calculateNutrientScore(getNutrientPercentage(date, 'fats'))
    };

    // Calculate final score with weights
    const finalScore = (
      scores.calories * 0.4 +
      scores.protein * 0.2 +
      scores.carbs * 0.2 +
      scores.fats * 0.2
    ) / 10; // Scale to 0-10

    // Save daily score
    try {
      await fetch(`${BASE_URL}/daily-health-scores/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          date: date.toISOString().split('T')[0],
          calories_score: scores.calories,
          protein_score: scores.protein,
          carbs_score: scores.carbs,
          fats_score: scores.fats,
          final_score: finalScore
        })
      });
    } catch (error) {
      console.error('Error saving daily score:', error);
    }

    return { ...scores, final: finalScore };
  };

  const loadMonthlyScores = async (month, year) => {
    try {
      const response = await fetch(`${BASE_URL}/monthly-health-scores/${userId}/${year}/${month}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const scores = {};
        let monthlyTotal = 0;
        let daysCount = 0;

        data.scores.forEach(score => {
          scores[score.date] = score;
          monthlyTotal += score.final_score;
          daysCount++;
        });

        setDailyScores(scores);
        
        // Update monthly average
        if (daysCount > 0) {
          onHealthScoreUpdate(monthlyTotal / daysCount);
        }
      }
    } catch (error) {
      console.error('Error loading monthly scores:', error);
    }
  };

  // Listen for changes in intake data
  useEffect(() => {
    if (intakeData.length > 0) {
      // Recalculate score for the current day
      const today = new Date();
      calculateDailyScore(today).then(score => {
        setDailyScores(prev => ({
          ...prev,
          [today.toISOString().split('T')[0]]: score
        }));
        loadMonthlyScores(today.getMonth(), today.getFullYear());
      });
    }
  }, [intakeData]);

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateStr = date.toISOString().split('T')[0];
      const score = dailyScores[dateStr]?.final || null;
      
      return (
        <div style={{ width: '100%', height: '100%' }}>
          <CalorieProgress 
            consumed={getNutrientPercentage(date, calendarNutrient)}
            limit={100}
            size={90}
            showDate={true}
            date={date.getDate()}
            dayName={new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date)}
            fontSize={6}
            dayNameSize={6}
            score={score}
          />
        </div>
      );
    }
    return null;
  };

  return (
    <div className="calendar-container">
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <div style={{ marginBottom: '20px' }}>
        {['calories', 'carbs', 'protein', 'fats'].map((nutrient) => (
          <button
            key={nutrient}
            onClick={() => setCalendarNutrient(nutrient.toLowerCase())}
            style={{
              padding: '8px 16px',
              margin: '0 5px',
              borderRadius: '20px',
              border: 'none',
              backgroundColor: calendarNutrient === nutrient.toLowerCase() ? '#34C759' : '#f0f0f0',
              color: calendarNutrient === nutrient.toLowerCase() ? 'white' : '#666',
              cursor: 'pointer'
            }}
          >
            {t(nutrient)}
          </button>
        ))}
      </div>

      <Calendar 
        tileContent={tileContent}
        showNeighboringMonth={false}
        formatDay={(locale, date) => ''}
        onActiveStartDateChange={({ activeStartDate }) => {
          // Update current view when month changes
          setCurrentView({
            month: activeStartDate.getMonth(),
            year: activeStartDate.getFullYear()
          });
          // Remove the direct score calculation from here since useEffect will handle it
        }}
      />
    </div>
  );
};

export default NutritionCalendar; 