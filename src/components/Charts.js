// IntakeTable.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Calendar from 'react-calendar';
import { Line } from 'react-chartjs-2';
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
  const [monthsToShow, setMonthsToShow] = useState(1);
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

  // Move getChartColors to the top, before it's used
  const getChartColors = (nutrientType) => {
    switch (nutrientType) {
      case 'calories':
        return {
          consumed: {
            border: '#34C759', // Green
            background: 'rgba(52, 199, 89, 0.1)'
          },
          limit: {
            border: '#007AFF', // Blue
            background: 'rgba(0, 122, 255, 0.05)'
          }
        };
      case 'carbs':
        return {
          consumed: {
            border: '#5856D6', // Purple
            background: 'rgba(88, 86, 214, 0.1)'
          },
          limit: {
            border: '#007AFF', // Blue
            background: 'rgba(0, 122, 255, 0.05)'
          }
        };
      case 'protein':
        return {
          consumed: {
            border: '#FF9500', // Orange
            background: 'rgba(255, 149, 0, 0.1)'
          },
          limit: {
            border: '#007AFF', // Blue
            background: 'rgba(0, 122, 255, 0.05)'
          }
        };
      case 'fats':
        return {
          consumed: {
            border: '#FF3B30', // Red
            background: 'rgba(255, 59, 48, 0.1)'
          },
          limit: {
            border: '#007AFF', // Blue
            background: 'rgba(0, 122, 255, 0.05)'
          }
        };
      default:
        return {
          consumed: {
            border: '#34C759',
            background: 'rgba(52, 199, 89, 0.1)'
          },
          limit: {
            border: '#007AFF',
            background: 'rgba(0, 122, 255, 0.05)'
          }
        };
    }
  };

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

  // First, define the getYAxisRange helper function
  const getYAxisRange = (data, padding = 10) => {
    const min = Math.min(...data.filter(val => val !== null));
    const max = Math.max(...data.filter(val => val !== null));
    return {
      min: Math.floor(min / 10) * 10 - padding,
      max: Math.ceil(max / 10) * 10 + padding,
    };
  };

  // Then create your chart data
  const nutrientData = getChartData(chartNutrient);
  const chartData = {
    labels: allDatesInMonth,
    datasets: [
      {
        label: `${t('consumed')} ${nutrientData.label}`,
        data: nutrientData.consumed,
        borderColor: getChartColors(chartNutrient).consumed.border,
        backgroundColor: getChartColors(chartNutrient).consumed.background,
        borderWidth: 2,
        fill: false,
        pointBackgroundColor: getChartColors(chartNutrient).consumed.border,
        pointRadius: 3,
        order: 2,
      },
      {
        label: `${nutrientData.label} ${t('limit')}`,
        data: nutrientData.required,
        borderColor: getChartColors(chartNutrient).limit.border,
        backgroundColor: 'rgba(0, 122, 255, 0.1)',
        borderWidth: 1,
        fill: true,
        pointRadius: 0,
        borderDash: [],
        order: 1,
      }
    ]
  };

  // Create weight chart data
  const weightChartData = {
    labels: allDatesInMonth,
    datasets: [
      {
        label: t('weight'),
        data: (() => {
          const latestWeightByDate = {};
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
            if (date > today) return null;
            if (latestWeightByDate[date]) {
              lastKnownWeight = latestWeightByDate[date];
            }
            return lastKnownWeight;
          });
        })(),
        borderColor: '#FF3B30',
        backgroundColor: 'rgba(255, 59, 48, 0.05)',
        fill: {
          target: 'origin',
          above: 'rgba(255, 59, 48, 0.05)', // Light red shadow for weight chart
        },
        borderWidth: 2,
        pointBackgroundColor: '#FF3B30',
        pointRadius: 3,
        borderDash: [],
        tension: 0.4,
        spanGaps: true,
      },
    ],
  };

  // Now calculate the ranges after the data is defined
  const nutrientYAxisRange = getYAxisRange(nutrientData.consumed.concat(nutrientData.required));
  const weightYAxisRange = getYAxisRange(weightChartData.datasets[0].data);

  // Finally define your chart options using the calculated ranges
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 2,
    scales: {
      y: {
        beginAtZero: false,
        min: nutrientYAxisRange.min,
        max: nutrientYAxisRange.max,
        title: {
          display: true,
          text: `${nutrientData.label} (${nutrientData.unit})`,
          font: {
            size: 12,
          },
        },
      },
      x: {
        title: {
          display: true,
          text: t('date_label'),
          font: {
            size: 12,
          },
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
    },
    plugins: {
      title: {
        display: true,
        text: `${nutrientData.label} ${t('intake chart')}`,
        font: {
          size: 14,
        },
      },
    },
  };

  const weightChartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 2,
    scales: {
      y: {
        beginAtZero: false,
        min: weightYAxisRange.min,
        max: weightYAxisRange.max,
        title: {
          display: true,
          text: t('weight_label'),
          font: {
            size: 12,
          },
        },
      },
      x: {
        title: {
          display: true,
          text: t('date_label'),
          font: {
            size: 12,
          },
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: t('weight_over_time'),
        font: {
          size: 14,
        },
      },
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

  return (
    <div className="main-content">
      {error && <p style={{ color: 'red' }}>{error}</p>}

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
      <div style={{ 
        marginBottom: '20px', 
        display: 'flex', 
        justifyContent: 'center',
        gap: '10px'
      }}>
        {['calories', 'carbs','protein', 'fats'].map((nutrient) => (
          <button
            key={nutrient}
            onClick={() => setChartNutrient(nutrient)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: 'none',
              backgroundColor: chartNutrient === nutrient ? '#34C759' : '#f0f0f0',
              color: chartNutrient === nutrient ? 'white' : '#666',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textTransform: 'capitalize'
            }}
          >
            {t(nutrient)}
          </button>
        ))}
      </div>

      {/* Chart container with fixed dimensions */}
      <div style={{ 
        width: '100%', 
        height: '300px',  // Fixed height
        marginBottom: '20px'
      }}>
        <Line 
          data={chartData} 
          options={{
            ...chartOptions,
            maintainAspectRatio: false,  // Allow chart to fill container
            elements: {
              line: {
                tension: 0.4  // Makes the line smoother
              },
              point: {
                radius: 3  // Smaller points
              }
            }
          }} 
        />
      </div>

      <h2>{t('weight_chart')}</h2>
      {/* Weight chart container with fixed dimensions */}
      <div style={{ 
        width: '100%', 
        height: '300px',  // Fixed height
        marginBottom: '20px'
      }}>
        <Line 
          data={weightChartData} 
          options={{
            ...weightChartOptions,
            maintainAspectRatio: false,  // Allow chart to fill container
            elements: {
              line: {
                tension: 0.4
              },
              point: {
                radius: 3
              }
            }
          }} 
        />
      </div>
    </div>
  );
};

export default IntakeTable;