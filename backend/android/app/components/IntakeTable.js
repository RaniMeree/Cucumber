// IntakeTable.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Calendar from 'react-calendar';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend, PointElement, LineElement } from 'chart.js';
import 'chartjs-plugin-zoom'; // Import the zoom plugin
import '../App.css';
import { useTranslation } from 'react-i18next';

// Register Chart.js components and plugins
ChartJS.register(BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend, PointElement, LineElement);

const IntakeTable = ({ userId, requiredCalories, onUpdateTotalCalories }) => {
  const { t } = useTranslation();
  const [intakeData, setIntakeData] = useState([]);
  const [dailyCalories, setDailyCalories] = useState({});
  const [error, setError] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [requiredCaloriesData, setRequiredCaloriesData] = useState([]);
  const [userCalories, setUserCalories] = useState(0); // Default value from users table
  const [visibleDetails, setVisibleDetails] = useState({}); // State to track visible details
  const [monthsToShow, setMonthsToShow] = useState(2);

  const axiosConfig = {
    headers: {
      'ngrok-skip-browser-warning': 'true',
      'Content-Type': 'application/json'
    }
  };

  const BASE_URL = String(process.env.REACT_APP_BASE_URL); // Convert to string

  useEffect(() => {
    if (!userId) {
      setError("User ID is missing.");
      return;
    } 

    // Fetch intake data
    axios.get(`${BASE_URL}/intake/${userId}`, axiosConfig)
      .then(response => {
        const data = response.data.intake || [];
        setIntakeData(data);

        const caloriesByDate = data.reduce((acc, record) => {
          const date = new Date(record.date);
          const dateString = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())).toISOString().split('T')[0];
          
          if (date.getFullYear() === currentYear && date.getMonth() === currentMonth) {
            const totalCalories = record.count * record.food_calories;
            acc[dateString] = (acc[dateString] || 0) + totalCalories;
          }
          return acc;
        }, {});

        setDailyCalories(caloriesByDate);
      })
      .catch(() => {
        setError("Failed to fetch intake data. Please try again later.");
      });

    // Fetch daily user stats
    axios.get(`${BASE_URL}/daily_user_stats/${userId}`, axiosConfig)
      .then(response => {
        console.log("Daily user stats response:", response.data);
        setRequiredCaloriesData(response.data || []);
      })
      .catch(error => {
        console.error("Error fetching daily user stats:", error);
        setRequiredCaloriesData([]); // Use empty array if fetching fails
      });

    // Fetch user data
    axios.get(`${BASE_URL}/get_user/${userId}`, axiosConfig)
      .then(response => {
        setUserCalories(response.data.calories);
      })
      .catch(error => {
        console.error("Error fetching user data:", error);
      });

  }, [userId, currentMonth, currentYear]);

  // Separate useEffect for fetching all intake data for charts
  useEffect(() => {
    if (!userId) return;

    // Fetch all intake data without month filtering
    axios.get(`${BASE_URL}/intake/${userId}`, axiosConfig)
      .then(response => {
        const data = response.data.intake || [];
        setIntakeData(data);

        // Process data for charts without month filtering
        const caloriesByDate = data.reduce((acc, record) => {
          const date = new Date(record.date);
          const dateString = date.toISOString().split('T')[0];
          acc[dateString] = (acc[dateString] || 0) + (record.count * record.food_calories);
          return acc;
        }, {});

        setDailyCalories(caloriesByDate);
      })
      .catch(() => {
        setError("Failed to fetch intake data. Please try again later.");
      });
  }, [userId]); // Remove currentMonth and currentYear from dependencies

  const getAllDates = (year, startMonth, numberOfMonths) => {
    const dates = [];
    // Start from previous months
    for (let i = 0; i < numberOfMonths; i++) {
      const month = startMonth - i;  // Subtract i instead of adding
      const actualYear = year + Math.floor(month / 12);
      const actualMonth = month >= 0 ? month % 12 : (month % 12 + 12);
      const lastDay = new Date(actualYear, actualMonth + 1, 0).getDate();
      
      for (let day = 1; day <= lastDay; day++) {
        const date = new Date(Date.UTC(actualYear, actualMonth, day));
        const dateString = date.toISOString().split('T')[0];
        dates.push(dateString);
      }
    }
    return dates.sort(); // Sort dates in chronological order
  };

  const allDatesInMonth = getAllDates(currentYear, currentMonth, monthsToShow);

  const completeDailyCalories = allDatesInMonth.reduce((acc, date) => {
    acc[date] = dailyCalories[date] || 0;
    return acc;
  }, {});

  const getRequiredCalories = (date) => {
    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0); // Normalize to local midnight

    if (requiredCaloriesData.length === 0) {
        return userCalories; // Fallback to users table value
    }

    // Sort records by date
    const sortedRecords = requiredCaloriesData.sort((a, b) => new Date(a.date) - new Date(b.date));
    let lastRequiredCalories = userCalories; // Fallback to users table

    for (const record of sortedRecords) {
        const recordDate = new Date(record.date);
        recordDate.setHours(0, 0, 0, 0); // Normalize to local midnight

        if (dateObj >= recordDate) {
            lastRequiredCalories = record.required_calories; // Update to the most recent value
        } else {
            break; // Stop if the record date is in the future
        }
    }

    return lastRequiredCalories; // Return the most recent requiredCalories found
  };

  const toggleDetails = (date) => {
    setVisibleDetails((prevState) => ({
      ...prevState,
      [date]: !prevState[date],
    }));
  };

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateString = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())).toISOString().split('T')[0];
      const totalCalories = dailyCalories[dateString] || 0;
      const requiredCaloriesForDate = getRequiredCalories(dateString);
      const calorieDifference = totalCalories - requiredCaloriesForDate;
      const backgroundColor = calorieDifference >= 0 ? 'lightcoral' : 'lightgreen';

      return (
        <div onClick={() => toggleDetails(dateString)} style={{ backgroundColor, padding: '5px', borderRadius: '5px', cursor: 'pointer', color: 'black' }}>
          {visibleDetails[dateString] && (
            <p style={{ margin: '0.3px 0', backgroundColor: '#ffcccc', color: 'black', padding: '2px', borderRadius: '3px' }}>
              {t('calories_limit')}: {Math.round(requiredCaloriesForDate)} 
            </p>
          )}
          {visibleDetails[dateString] && (
            <p style={{ margin: '0.3px 0', backgroundColor: '#cce5ff', color: 'black', padding: '2px', borderRadius: '3px' }}>
              {t('consumed_today')}: {Math.round(totalCalories)} 
            </p>
          )}
          {visibleDetails[dateString] && (
            <p style={{ margin: '0.3px 0', backgroundColor: '#f8f9fa', color: 'black', padding: '2px', borderRadius: '3px' }}>
              {t('offset')}: {Math.round(calorieDifference)} 
            </p>
          )}
        </div>
      );
    }
    return null;
  };


  const chartData = {
    labels: allDatesInMonth,
    datasets: [
      {
        label: t('consumed_calories'),
        data: allDatesInMonth.map(date => completeDailyCalories[date]),
        backgroundColor: 'rgba(255, 0, 0, 0.5)',
        borderColor: 'rgb(255, 0, 0)',
        borderWidth: 1
      },
      {
        label: t('calorie_limit'),
        data: allDatesInMonth.map(date => getRequiredCalories(date)),
        backgroundColor: 'rgba(255, 192, 203, 0.5)',
        borderColor: 'rgb(255, 192, 203)',
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: t('calories'),
        },
      },
      x: {
        title: {
          display: true,
          text: t('date_label'),
        },
      },
    },
    plugins: {
      title: {
        display: true,
        text: t('calorie_chart')
      }
    },
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handlePreviousDay = () => {
    const prevDate = new Date(selectedDate);
    prevDate.setDate(prevDate.getDate() - 1);
    setSelectedDate(prevDate.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + 1);
    setSelectedDate(nextDate.toISOString().split('T')[0]);
  };

  const filteredIntakeData = intakeData.filter(record => {
    const recordDate = new Date(record.date).toISOString().split('T')[0];
    return recordDate === selectedDate;
  });

  // Add this function to calculate total calories
  const calculateTotalCalories = () => {
    return filteredIntakeData.reduce((total, record) => {
      return total + Math.round(record.count * record.food_calories);
    }, 0);
  };

  // Calculate the difference values
  const differenceValues = allDatesInMonth.map(date => {
    const totalCalories = completeDailyCalories[date] || 0;
    const requiredCalories = getRequiredCalories(date);
    return totalCalories - requiredCalories; // Difference
  });

  // Create an array to hold the weight values
  const weightDataArray = allDatesInMonth.map(date => {
    const weightData = requiredCaloriesData.find(record => new Date(record.date).toISOString().split('T')[0] === date);
    return weightData ? weightData.weight : null; // Store weight or null if not available
  });

  // Create an array to hold the final weight values with carry forward logic
  const finalWeightData = [];
  let lastKnownWeight = null;

  allDatesInMonth.forEach((date, index) => {
    const weightData = weightDataArray[index];
    if (weightData !== null) {
      lastKnownWeight = weightData; // Update last known weight
    }
    finalWeightData.push(lastKnownWeight !== null ? lastKnownWeight : 0); // Use last known weight or 0 if none
  });

  // Create chart data for calories only
  const differenceChartData = {
    labels: allDatesInMonth,
    datasets: [
      {
        label: 'Consumed Calories',
        data: allDatesInMonth.map(date => {
          const value = completeDailyCalories[date] || 0;
          return value === 0 ? null : value;  // Convert 0 to null to hide the point
        }),
        borderColor: 'rgba(255, 206, 86, 1)', // Yellow line
        backgroundColor: 'rgba(255, 206, 86, 0.2)',
        fill: false,
        type: 'line',
        tension: 0.1,
        spanGaps: true,  // This will create gaps in the line for null values
      }
    ],
  };

  // Update chart options to reflect calories only
  const differenceChartOptions = {
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Calories',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Date',
        },
      },
    },
    plugins: {
      zoom: {
        pan: {
          enabled: true,
          mode: 'x',
        },
        zoom: {
          enabled: true,
          mode: 'x',
        },
      },
    },
  };

  // Create chart data for weight only
  const weightChartData = {
    labels: allDatesInMonth,
    datasets: [
      {
        label: t('weight'),
        data: (() => {
          // Create a map to store the latest weight for each date
          const latestWeightByDate = {};

          // Sort records by date and time to ensure the latest entry is used
          requiredCaloriesData
            .filter(record => record.weight)
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .forEach(record => {
              const dateStr = new Date(record.date).toISOString().split('T')[0];
              latestWeightByDate[dateStr] = record.weight;
            });

          const today = new Date().toISOString().split('T')[0];
          let lastKnownWeight = null;

          return allDatesInMonth.map(date => {
            // Skip dates after today
            if (date > today) {
              return null;
            }

            // Update last known weight if there's a weight for this date
            if (latestWeightByDate[date]) {
              lastKnownWeight = latestWeightByDate[date];
            }

            // Return the last known weight
            return lastKnownWeight;
          });
        })(),
        borderColor: 'rgba(255, 0, 0, 1)',
        backgroundColor: 'rgba(255, 0, 0, 0.2)',
        fill: false,
        type: 'line',
        tension: 0.1,
        spanGaps: true,
      },
    ],
  };

  // Chart options for weight chart
  const weightChartOptions = {
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: t('weight_label'),
        },
      },
      x: {
        title: {
          display: true,
          text: t('date_label'),
        },
      },
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: t('weight_over_time')
      }
    }
  };

  console.log("Weight Data:", allDatesInMonth.map(date => {
    const weightData = requiredCaloriesData.find(record => new Date(record.date).toISOString().split('T')[0] === date);
    return weightData ? weightData.weight : null; // Log the weight data
  }));

  // Add this useEffect to update the total calories whenever filtered data changes
  useEffect(() => {
    const todayTotal = calculateTotalCalories();
    onUpdateTotalCalories(todayTotal);
  }, [filteredIntakeData, onUpdateTotalCalories]);

  return (
    <div className="main-content">
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <button onClick={handlePreviousDay} style={{ marginRight: '10px', padding: '5px 10px', borderRadius: '5px', backgroundColor: '#329843', color: '#fff', border: 'none' }}>
          {t('previous_day')}
        </button>
        <input 
          type="date" 
          value={selectedDate} 
          onChange={handleDateChange} 
          style={{ marginRight: '10px', padding: '5px', borderRadius: '5px', border: '1px solid #ddd' }} 
        />
        <button onClick={handleNextDay} style={{ padding: '5px 10px', borderRadius: '5px', backgroundColor: '#329843', color: '#fff', border: 'none' }}>
          {t('next_day')}
        </button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f8f9fa' }}>{t('item')}</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f8f9fa' }}>{t('portion')}</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f8f9fa' }}>{t('calories_per_gram')}</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f8f9fa' }}>{t('total_cal')}</th>
          </tr>
        </thead>
        <tbody>
          {filteredIntakeData.map((record, index) => (
            <tr key={index}>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{record.food_name}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{Math.round(record.count)}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{record.food_calories}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{Math.round(record.count * record.food_calories)}</td>
            </tr>
          ))}
          <tr>
            <td colSpan="3" style={{ textAlign: 'right', padding: '8px', fontWeight: 'bold' }}>{t('total')}:</td>
            <td style={{ border: '1px solid #ddd', padding: '8px', fontWeight: 'bold' }}>{calculateTotalCalories()}</td>
          </tr>
        </tbody>
      </table>

      <h2>{t('monthly_overview')}</h2>
      <Calendar 
        tileContent={tileContent}
        formatDay={(locale, date) => {
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
          return (
            <div style={{ 
              fontWeight: 'bold',
              textDecoration: 'underline',
              marginBottom: '5px'
            }}>
              {date.getDate()} {dayName}
            </div>
          );
        }}
        formatShortWeekday={() => ''}
        showNeighboringMonth={false}
      />

      <div style={{ marginTop: '20px', marginBottom: '20px' }}>
        <label>{t('monthly_overview')}: </label>
        <select 
          value={monthsToShow} 
          onChange={(e) => setMonthsToShow(Number(e.target.value))}
          style={{ padding: '5px', borderRadius: '4px' }}
        >
          {[1,2,3,4,5,6,7,8,9,10,11,12].map(num => (
            <option key={num} value={num}>{num}</option>
          ))}
        </select>
      </div>

      <h2>{t('calorie_chart')}</h2>
      <Bar data={chartData} options={chartOptions} />

      <h2>{t('weight_chart')}</h2>
      <Bar data={weightChartData} options={weightChartOptions} />
    </div>
  );
};

export default IntakeTable;