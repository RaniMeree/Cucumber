// IntakeTable.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Calendar from 'react-calendar';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend, PointElement, LineElement } from 'chart.js';
import 'chartjs-plugin-zoom'; // Import the zoom plugin
import '../App.css';
import { useTranslation } from 'react-i18next';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import CalorieProgress from './CalorieProgress';

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
  const [selectedNutrient, setSelectedNutrient] = useState('calories');
  const [calendarNutrient, setCalendarNutrient] = useState('calories');
  const [chartNutrient, setChartNutrient] = useState('calories');

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
    console.log('Fetching intake data for user:', userId); // Debug log
    axios.get(`${BASE_URL}/intake/${userId}`, axiosConfig)
      .then(response => {
        console.log('Raw intake response:', response.data); // Debug log
        const data = response.data.intake || [];
        console.log('Processed intake data:', data); // Debug log
        setIntakeData(data);

        const caloriesByDate = data.reduce((acc, record) => {
          console.log('Processing record:', record); // Debug log for each record
          const recordDate = new Date(record.date);
          const localDate = new Date(recordDate.getTime() - recordDate.getTimezoneOffset() * 60000)
            .toISOString()
            .split('T')[0];
          
          if (recordDate.getFullYear() === currentYear && recordDate.getMonth() === currentMonth) {
            const totalCalories = record.count * record.food_calories;
            acc[localDate] = (acc[localDate] || 0) + totalCalories;
          }
          return acc;
        }, {});

        setDailyCalories(caloriesByDate);
      })
      .catch((error) => {
        console.error('Error fetching intake data:', error);
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
          const recordDate = new Date(record.date);
          const localDate = new Date(recordDate.getTime() - recordDate.getTimezoneOffset() * 60000)
            .toISOString()
            .split('T')[0];
          acc[localDate] = (acc[localDate] || 0) + (record.count * record.food_calories);
          return acc;
        }, {});

        setDailyCalories(caloriesByDate);
      })
      .catch(() => {
        setError("Failed to fetch intake data. Please try again later.");
      });
  }, [userId]); // Remove currentMonth and currentYear from dependencies

  const getAllDates = (numberOfMonths) => {
    const dates = [];
    const today = new Date();
    
    // Start from today and go backwards
    for (let i = 0; i < numberOfMonths; i++) {
      const currentMonth = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
      
      for (let day = 1; day <= lastDay; day++) {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        // Skip future dates
        if (date > today) continue;
        const dateString = date.toISOString().split('T')[0];
        dates.unshift(dateString); // Add to beginning of array to maintain chronological order
      }
    }
    
    return dates.sort(); // Ensure dates are in chronological order
  };

  const allDatesInMonth = getAllDates(monthsToShow);

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

  const getNutrientPercentage = (date, nutrientType) => {
    const dateString = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())).toISOString().split('T')[0];
    const dailyTotal = dailyCalories[dateString] || 0;
    const requiredCalories = getRequiredCalories(dateString);

    switch (nutrientType) {
      case 'calories':
        return (dailyTotal / requiredCalories) * 100;
      case 'protein':
        const totalProtein = intakeData
          .filter(record => new Date(record.date).toISOString().split('T')[0] === dateString)
          .reduce((sum, record) => sum + (record.count * record.food_protein), 0);
        return (totalProtein / ((requiredCalories * 0.3) / 4)) * 100;
      case 'fats':
        const totalFats = intakeData
          .filter(record => new Date(record.date).toISOString().split('T')[0] === dateString)
          .reduce((sum, record) => sum + (record.count * record.food_fats), 0);
        return (totalFats / ((requiredCalories * 0.25) / 9)) * 100;
      case 'carbs':
        const totalCarbs = intakeData
          .filter(record => new Date(record.date).toISOString().split('T')[0] === dateString)
          .reduce((sum, record) => sum + (record.count * record.food_carbs), 0);
        return (totalCarbs / ((requiredCalories * 0.45) / 4)) * 100;
      default:
        return 0;
    }
  };

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateString = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())).toISOString().split('T')[0];
      const percentage = getNutrientPercentage(date, calendarNutrient);
      const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);

      return (
        <div style={{ width: '100%', height: '100%' }}>
          <CalorieProgress 
            consumed={percentage}
            limit={100}
            size={90}
            showDate={true}
            date={date.getDate()}
            dayName={dayName}
          />
        </div>
      );
    }
    return null;
  };

  const getChartData = (nutrientType) => {
    const data = {
      calories: {
        consumed: {
          backgroundColor: 'rgba(52, 199, 89, 0.5)', // Green
          borderColor: 'rgb(52, 199, 89)',
        },
        required: {
          backgroundColor: 'rgba(52, 199, 89, 0.2)',
          borderColor: 'rgb(52, 199, 89)',
        }
      },
      protein: {
        consumed: {
          backgroundColor: 'rgba(255, 165, 0, 0.5)', // Orange
          borderColor: 'rgb(255, 165, 0)',
        },
        required: {
          backgroundColor: 'rgba(255, 165, 0, 0.2)',
          borderColor: 'rgb(255, 165, 0)',
        }
      },
      fats: {
        consumed: {
          backgroundColor: 'rgba(255, 59, 48, 0.5)', // Red
          borderColor: 'rgb(255, 59, 48)',
        },
        required: {
          backgroundColor: 'rgba(255, 59, 48, 0.2)',
          borderColor: 'rgb(255, 59, 48)',
        }
      },
      carbs: {
        consumed: {
          backgroundColor: 'rgba(88, 86, 214, 0.5)', // Purple
          borderColor: 'rgb(88, 86, 214)',
        },
        required: {
          backgroundColor: 'rgba(88, 86, 214, 0.2)',
          borderColor: 'rgb(88, 86, 214)',
        }
      }
    };

    switch (nutrientType) {
      case 'calories':
        return {
          consumed: allDatesInMonth.map(date => completeDailyCalories[date] || 0),
          required: allDatesInMonth.map(date => getRequiredCalories(date)),
          label: t('calories'),
          unit: '',
          colors: data.calories
        };
      case 'protein':
        return {
          consumed: allDatesInMonth.map(date => {
            const dateData = intakeData.filter(record => 
              new Date(record.date).toISOString().split('T')[0] === date
            );
            return dateData.reduce((sum, record) => 
              sum + (record.count * record.food_protein), 0
            );
          }),
          required: allDatesInMonth.map(date => 
            (getRequiredCalories(date) * 0.3) / 4
          ),
          label: t('protein'),
          unit: 'g',
          colors: data.protein
        };
      case 'fats':
        return {
          consumed: allDatesInMonth.map(date => {
            const dateData = intakeData.filter(record => 
              new Date(record.date).toISOString().split('T')[0] === date
            );
            return dateData.reduce((sum, record) => 
              sum + (record.count * record.food_fats), 0
            );
          }),
          required: allDatesInMonth.map(date => 
            (getRequiredCalories(date) * 0.25) / 9
          ),
          label: t('fats'),
          unit: 'g',
          colors: data.fats
        };
      case 'carbs':
        return {
          consumed: allDatesInMonth.map(date => {
            const dateData = intakeData.filter(record => 
              new Date(record.date).toISOString().split('T')[0] === date
            );
            return dateData.reduce((sum, record) => 
              sum + (record.count * record.food_carbs), 0
            );
          }),
          required: allDatesInMonth.map(date => 
            (getRequiredCalories(date) * 0.45) / 4
          ),
          label: t('carbs'),
          unit: 'g',
          colors: data.carbs
        };
      default:
        return {
          consumed: [],
          required: [],
          label: '',
          unit: '',
          colors: data.calories
        };
    }
  };

  const nutrientData = getChartData(chartNutrient);
  const chartData = {
    labels: allDatesInMonth,
    datasets: [
      {
        label: `${t('consumed')} ${nutrientData.label}`,
        data: nutrientData.consumed,
        backgroundColor: nutrientData.colors.consumed.backgroundColor,
        borderColor: nutrientData.colors.consumed.borderColor,
        borderWidth: 1
      },
      {
        label: `${nutrientData.label} ${t('limit')}`,
        data: nutrientData.required,
        backgroundColor: nutrientData.colors.required.backgroundColor,
        borderColor: nutrientData.colors.required.borderColor,
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
          text: `${nutrientData.label} (${nutrientData.unit})`,
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
        text: `${nutrientData.label} ${t('intake_chart')}`
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
    console.log('Filtering record:', record); // Debug log for filtering
    const recordDate = new Date(record.date);
    const localDate = new Date(recordDate.getTime() - recordDate.getTimezoneOffset() * 60000)
      .toISOString()
      .split('T')[0];
    return localDate === selectedDate;
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

  const handleDeleteIntake = async (intakeId) => {
    try {
      console.log(`Attempting to delete intake with ID: ${intakeId} for user: ${userId}`);
      
      const response = await fetch(`${BASE_URL}/intake/${userId}/${intakeId}`, {
        method: 'DELETE',
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });

      if (response.ok) {
        console.log('Successfully deleted intake');
        // Remove the deleted item from the state
        setIntakeData(prevData => prevData.filter(item => item.id !== intakeId));
        setError(null);
      } else {
        console.error('Server returned error:', response.status);
        setError("Failed to delete intake.");
      }
    } catch (error) {
      console.error('Error deleting intake:', error);
      setError("Failed to delete intake.");
    }
  };

  // Update the table header and cell styles
  const tableHeaderStyle = {
    border: '1px solid #ddd',
    padding: '3px',  // Reduced from 8px
    backgroundColor: '#f8f9fa',
    fontSize: '0.7rem'  // Reduced font size
  };

  const tableCellStyle = {
    border: '1px solid #ddd',
    padding: '3px',  // Reduced from 8px
    fontSize: '0.7rem'  // Reduced font size
  };

  console.log("Filtered Intake Data:", filteredIntakeData);

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

      <div style={{
        backgroundColor: 'white',
        borderRadius: '6px',
        padding: '5px',
        margin: '5px 0',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        width: '100%'
      }}>
        <h3 style={{ 
          marginBottom: '15px',
          color: '#2c3e50',
          borderBottom: '2px solid #f0f0f0',
          paddingBottom: '10px'
        }}>
          {t('Nutritional requirements')}<br /> {selectedDate}
        </h3>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '4px',
          flexWrap: 'nowrap',
          paddingBottom: '10px'
        }}>
          <div style={{
            flex: '1',
            textAlign: 'center',
            padding: '10px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <span style={{ color: '#666', fontSize: '0.7em' }}>{t('calories_limit')}</span>
            <div style={{ whiteSpace: 'nowrap' }}>
              <strong style={{ color: '#34C759', fontSize: '0.9em' }}>
                {Math.round(getRequiredCalories(selectedDate))}
              </strong>
              <span style={{ color: '#000', fontSize: '0.7em' }}> /g</span>
            </div>
          </div>

          <div style={{
            flex: '1',
            textAlign: 'center',
            padding: '10px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <span style={{ color: '#666', fontSize: '0.7em' }}>{t('Required protein')}</span>
            <div style={{ whiteSpace: 'nowrap' }}>
              <strong style={{ color: '#FF9500', fontSize: '0.9em' }}>
                {Math.round((getRequiredCalories(selectedDate) * 0.3) / 4)}
              </strong>
              <span style={{ color: '#000', fontSize: '0.7em' }}> /g</span>
            </div>
          </div>

          <div style={{
            flex: '1',
            textAlign: 'center',
            padding: '10px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <span style={{ color: '#666', fontSize: '0.7em' }}>{t('Required carbs')}</span>
            <div style={{ whiteSpace: 'nowrap' }}>
              <strong style={{ color: '#5856D6', fontSize: '0.9em' }}>
                {Math.round((getRequiredCalories(selectedDate) * 0.45) / 4)}
              </strong>
              <span style={{ color: '#000', fontSize: '0.7em' }}> /g</span>
            </div>
          </div>

          <div style={{
            flex: '1',
            textAlign: 'center',
            padding: '10px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <span style={{ color: '#666', fontSize: '0.7em' }}>{t('Required fats')}</span>
            <div style={{ whiteSpace: 'nowrap' }}>
              <strong style={{ color: '#FF2D55', fontSize: '0.9em' }}>
                {Math.round((getRequiredCalories(selectedDate) * 0.25) / 9)}
              </strong>
              <span style={{ color: '#000', fontSize: '0.7em' }}> /g</span>
            </div>
          </div>
        </div>
      </div>

      <table style={{ 
        width: '100%', 
        borderCollapse: 'collapse', 
        marginBottom: '20px',
        fontSize: '0.8rem',  // Base font size for the table
        maxWidth: '100%',    // Ensures table doesn't overflow
        overflowX: 'auto'    // Allows horizontal scrolling if needed
      }}>
        <thead>
          <tr>
            <th style={tableHeaderStyle}>{t('item')}</th>
            <th style={tableHeaderStyle}>{t('portion')}</th>
            <th style={tableHeaderStyle}>{t('Calories')} (g)</th>
            <th style={tableHeaderStyle}> {t('Carbs')} (g)</th>
            <th style={tableHeaderStyle}>{t('Protein')} (g)</th>
            <th style={tableHeaderStyle}> {t('Fats')} (g)</th>
            
            <th style={tableHeaderStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredIntakeData.map((record, index) => {
            console.log("Record:", record);
            return (
              <tr key={index}>
                <td style={tableCellStyle}>{record.name || record.food_name || 'Unknown'}</td>
                <td style={tableCellStyle}>{Math.round(record.count)}</td>
                <td style={tableCellStyle}>{Math.round(record.count * record.food_calories)}</td>
                <td style={tableCellStyle}>{Math.round(record.count * record.food_carbs)}</td>
                <td style={tableCellStyle}>{Math.round(record.count * record.food_protein)}</td>
                <td style={tableCellStyle}>{Math.round(record.count * record.food_fats)}</td>
                
                <td style={tableCellStyle}>
                  <button onClick={() => handleDeleteIntake(record.id)} style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', padding: '5px' }}>
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </td>
              </tr>
            );
          })}
          <tr>
            <td colSpan="2" style={{ 
              textAlign: 'right', 
              padding: '8px', 
              fontWeight: 'bold' 
            }}>
              {t('total')}:
            </td>
            <td style={{
              ...tableCellStyle,
              color: '#34C759', // Green for calories
              fontWeight: 'bold'
            }}>
              {calculateTotalCalories()}
            </td>
            <td style={{
              ...tableCellStyle,
              color: '#5856D6', // Purple for carbs
              fontWeight: 'bold'
            }}>
              {Math.round(filteredIntakeData.reduce((sum, record) => 
                sum + (record.count * record.food_carbs), 0
              ))}
            </td>
            <td style={{
              ...tableCellStyle,
              color: '#FF9500', // Orange for protein
              fontWeight: 'bold'
            }}>
              {Math.round(filteredIntakeData.reduce((sum, record) => 
                sum + (record.count * record.food_protein), 0
              ))}
            </td>
            <td style={{
              ...tableCellStyle,
              color: '#FF2D55', // Red for fats
              fontWeight: 'bold'
            }}>
              {Math.round(filteredIntakeData.reduce((sum, record) => 
                sum + (record.count * record.food_fats), 0
              ))}
            </td>
            <td></td>
          </tr>
        </tbody>
      </table>

      
      

      

    </div>
  );
};

export default IntakeTable;