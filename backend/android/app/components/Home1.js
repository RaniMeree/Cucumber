import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import IntakeTable, { totalConsumedCaloriesToday } from './IntakeTable';
import Profile from './Profile';  // Add this import
import '../App.css';
import logo from '../assets/logo.png';  
import LoadingScreen from './LoadingScreen';
import CustomAlert from './CustomAlert';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera, faUpload, faKeyboard, faPlus, faListAlt, faCog, faSignOutAlt, faBook, faTrash, faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import MyRecipes from './MyRecipes';
import { useTranslation } from 'react-i18next';
import '../i18n/i18n';
import ReactAutocomplete from 'react-autocomplete';



const BASE_URL = process.env.REACT_APP_BASE_URL; // Access the base URL
const Home = () => {
  const { t, i18n } = useTranslation();
  const { state } = useLocation();
  const [showIntakeTable, setShowIntakeTable] = useState(false);
  const [showProfile, setShowProfile] = useState(false);  // Add this state

  const [foodsId, setFoodsId] = useState(0);
  const [count, setCount] = useState('');
  const [foodCalories, setFoodCalories] = useState('');
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [showForm, setShowForm] = useState(false);
  const [cameraIsOpen, setCameraIsOpen] = useState(false);
  const [imageDataUrl, setImageDataUrl] = useState(null);
  const videoElement = useRef(null);
  const streamRef = useRef(null);
  const navigate = useNavigate();
  const username = localStorage.getItem('username');
  const userId = localStorage.getItem('user_id');
  const requiredCalories = localStorage.getItem('requiredCalories');
  const [predictedFood, setPredictedFood] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [foodName, setFoodName] = useState('Unknown');
  const [foodId, setFoodId] = useState(null);
  const [activeSection, setActiveSection] = useState('newInput');
  const [foodsList, setFoodsList] = useState([]);
  const [foodsAndCalories, setFoodsAndCalories] = useState([]);
  const [todayRequiredCalories, setTodayRequiredCalories] = useState(0);
  const [showCalorieCalculator, setShowCalorieCalculator] = useState(false);
  const [ingredients, setIngredients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);  // Start with loading true
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [userFoods, setUserFoods] = useState([]);
  const [recipeName, setRecipeName] = useState('');
  const [showCalculationResult, setShowCalculationResult] = useState(false);
  const [calculatedCalories, setCalculatedCalories] = useState(0);
  const [showMyRecipes, setShowMyRecipes] = useState(false);
  const [todayTotal, setTodayTotal] = useState(0);  // Instead of totalConsumedCaloriesToday
  const [showSimpleForm, setShowSimpleForm] = useState(false);
  const [showRecipesForm, setShowRecipesForm] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isRawFood, setIsRawFood] = useState(false);
  const [amount, setAmount] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
    }
    setIsLoading(false);  // Hide loading after initial check
  }, [navigate]);

  useEffect(() => {
    setIsLoading(true);
    const userId = localStorage.getItem('user_id');
    
    Promise.all([
      // Existing foods fetch
      fetch(`${BASE_URL}/api/foods`, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      }),
      fetch(`${BASE_URL}/api/calories`, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      }),
      // Add new fetch for user foods
      fetch(`${BASE_URL}/api/user-foods/${userId}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      })
    ])
      .then(([foodsRes, caloriesRes, userFoodsRes]) => 
        Promise.all([foodsRes.json(), caloriesRes.json(), userFoodsRes.json()])
      )
      .then(([foodsData, caloriesData, userFoodsData]) => {
        // Combine regular foods
        const regularFoods = foodsData.foods.map((food, index) => ({
          name: food,
          calories: caloriesData.calories[index],
          isPersonal: false
        }));
        
        // Add user foods
        const userFoods = userFoodsData.foods.map(food => ({
          ...food,
          isPersonal: true
        }));
        
        // Combine both lists
        setFoodsAndCalories([...regularFoods, ...userFoods]);
      })
      .catch(error => console.error('Error:', error))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const user_id = localStorage.getItem('user_id');
    if (user_id) {
      fetch(`${BASE_URL}/daily_user_stats/${user_id}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      })
        .then(response => response.json())
        .then(data => {
          // Get today's date
          const today = new Date();
          const todayStr = today.toISOString().split('T')[0];
          
          // Sort records by date in descending order (newest first)
          const sortedRecords = data.sort((a, b) => new Date(b.date) - new Date(a.date));
          
          // Find the most recent record that is not in the future
          const latestRecord = sortedRecords.find(record => 
            new Date(record.date).toISOString().split('T')[0] <= todayStr
          );
          
          if (latestRecord) {
            setTodayRequiredCalories(Math.round(latestRecord.required_calories));
          } else {
            // If no past records found, use the default required calories
            setTodayRequiredCalories(Math.round(requiredCalories));
          }
        })
        .catch(error => {
          console.error("Error fetching daily stats:", error);
          setTodayRequiredCalories(Math.round(requiredCalories));
        });
    }
  }, []);

  useEffect(() => {
    const userId = localStorage.getItem('user_id');
    const token = localStorage.getItem('access_token');
    console.log("Fetching user foods for userId:", userId);
    
    if (!userId) {
      console.error('No user ID found');
      return;
    }

    fetch(`${BASE_URL}/api/user-foods/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true'
      },
      credentials: 'include'
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log("Received user foods data:", data);
        if (Array.isArray(data.foods)) {
          setUserFoods(data.foods);
          console.log("Updated userFoods state:", data.foods);
        } else {
          console.error("Received invalid data format:", data);
          setUserFoods([]);
        }
      })
      .catch(error => {
        console.error('Error fetching user foods:', error);
        setUserFoods([]);
      });
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSuggestions && !event.target.closest('.recipes-form')) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSuggestions]);

  const handleLogout = () => {
    localStorage.removeItem('user_id');
    localStorage.removeItem('access_token');
    localStorage.removeItem('username');
    sessionStorage.clear();
    navigate('/login');
  };

  const startCamera = async () => {
    try {
      setCameraIsOpen(true);
      setShowForm(false);
      
      // Specify the back camera
      const constraints = {
        video: {
          facingMode: { exact: "environment" } // This requests the back camera
        }
      };

      // Try back camera first
      try {
        streamRef.current = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        // If back camera fails, fall back to any available camera
        console.log('Back camera not available, falling back to default camera');
        streamRef.current = await navigator.mediaDevices.getUserMedia({ 
          video: true 
        });
      }

      videoElement.current.srcObject = streamRef.current;
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Could not access camera. Please make sure you have granted camera permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      setCameraIsOpen(false);
      streamRef.current.getTracks().forEach((track) => track.stop());
      videoElement.current.srcObject = null;
      streamRef.current = null;
    }
  };

  const takePhoto = async () => {
    if (!streamRef.current) {
        console.error('Camera not started.');
        return;
    }

    setIsProcessing(true);

    try {
        const canvas = document.createElement('canvas');
        canvas.width = videoElement.current.videoWidth;
        canvas.height = videoElement.current.videoHeight;
        canvas.getContext('2d').drawImage(videoElement.current, 0, 0, canvas.width, canvas.height);

        const capturedImageDataUrl = canvas.toDataURL('image/png');
        setImageDataUrl(capturedImageDataUrl);

        stopCamera();

        const blobData = dataURLtoBlob(capturedImageDataUrl);  
        const imageFile = new File([blobData], 'captured-image.png', { type: 'image/png' });

        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('language', i18n.language);

        const response = await fetch(`${BASE_URL}/process-food-image`, {
            method: 'POST',
            headers: {
                'ngrok-skip-browser-warning': 'true',
                'Accept-Language': i18n.language
            },
            body: formData
        });

        const result = await response.json();
        console.log("API Result:", result); // Debugging: Log the entire result

        if (result.food_name.includes("No food detected")) {
            showCustomAlert(
                <div className="custom-alert">
                    <p>{t('no_food_detected')}</p>
                    <button 
                        onClick={() => {
                            setShowAlert(false);
                            startCamera(); // For takePhoto
                            // Or trigger file input for handleUpload
                        }}
                        className="primary-button"
                    >
                        {t('try_again')}
                    </button>
                </div>
            );
            setFoodName('');
            setFoodCalories('');
            return;  // Stop further processing
        }

        // Parse the CLIP prediction string: "Dolma, 1.0 cal/g with confidence 0.95"
        const predictionParts = result.food_name.split(','); // Split by comma
        const foodName = predictionParts[0]; // "Dolma"
        const caloriesMatch = predictionParts[1].match(/(\d+\.?\d*)/); // Extract number
        const caloriesPerGram = caloriesMatch ? parseFloat(caloriesMatch[0]) : 0; // "1.0"

        console.log("Extracted Food Name:", foodName);
        console.log("Extracted Calories:", caloriesPerGram);

        setFoodName(foodName);
        setFoodCalories(caloriesPerGram);
        setShowForm(true);

    } catch (error) {
        console.error('Error processing image:', error);
        showCustomAlert(t('camera_error'));
    } finally {
        setIsProcessing(false);
    }
  };

  const handleUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
        setIsProcessing(true);

        const formData = new FormData();
        formData.append('image', file, 'image.jpg');

        fetch(`${BASE_URL}/process-food-image`, {
            method: 'POST',
            headers: {
                'ngrok-skip-browser-warning': 'true',
                'Accept-Language': i18n.language
            },
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then((result) => {
            console.log("API Result:", result); // Debugging: Log the entire result

            // Parse the CLIP prediction string: "Dolma, 1.0 cal/g with confidence 0.95"
            const predictionParts = result.food_name.split(','); // Split by comma
            const foodName = predictionParts[0]; // "Dolma"
            const caloriesMatch = predictionParts[1].match(/(\d+\.?\d*)/); // Extract number
            const caloriesPerGram = caloriesMatch ? parseFloat(caloriesMatch[0]) : 0; // "1.0"

            console.log("Extracted Food Name:", foodName);
            console.log("Extracted Calories:", caloriesPerGram);

            setFoodName(foodName);
            setFoodCalories(caloriesPerGram);
            setShowForm(true);
        })
        .catch((error) => {
            console.error('Error processing image:', error);
            showCustomAlert(
              <div>
                <p>{t('no_food_detected')}</p>
                <button 
                  onClick={() => {
                    setShowAlert(false);
                    // Optionally restart the process
                  }}
                  className="primary-button"
                  style={{ marginTop: '10px' }}
                >
                  {t('try_again')}
                </button>
              </div>
            );
            setFoodName('');
            setFoodCalories('');
            setShowForm(false);
        })
        .finally(() => {
            setIsProcessing(false);
        });
    }
  };

  const handleFormSubmit = (event) => {
    event.preventDefault();
    
    const formData = new FormData();
    formData.append('user_id', parseInt(userId));
    
    // Get the food name and ID
    const submittedFoodName = predictedFood ? predictedFood.name : foodName;
    const submittedFoodId = predictedFood ? predictedFood.id : 0;  // Use 0 for manual entries
    
    formData.append('food_name', submittedFoodName);
    formData.append('foods_id', submittedFoodId);
    
    const submittedCount = parseFloat(count);
    if (isNaN(submittedCount)) {
        showCustomAlert('Please enter a valid amount.');
        return;
    }
    formData.append('count', submittedCount);
    
    const submittedCalories = predictedFood ? predictedFood.calories : parseFloat(foodCalories);
    if (isNaN(submittedCalories)) {
        showCustomAlert('Please enter valid calories.');
        return;
    }
    formData.append('food_calories', submittedCalories);
    
    formData.append('date', date);

    fetch(`${BASE_URL}/submit/`, {
        method: 'POST',
        body: formData,
        headers: {
            'ngrok-skip-browser-warning': 'true'
        }
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.message || 'Submission failed');
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('Success:', data);
        // Reset form
        setFoodId(0);
        setFoodName('');
        setCount('');
        setFoodCalories('');
        setDate(() => {
            const today = new Date();
            return today.toISOString().split('T')[0];
        });
        setImageDataUrl(null);
        setShowForm(false);
        setPredictedFood(null);
        stopCamera();
    })
    .catch(error => {
        console.error('Error:', error);
        showCustomAlert('Error submitting form. Please check all fields are filled correctly.');
    });
  };

  const dataURLtoBlob = (dataUrl) => {
    const byteString = atob(dataUrl.split(',')[1]);
    const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  };

  const handleCorrectPrediction = () => {
    setShowForm(true);  // Show the form when user confirms prediction is correct
  };

  const handleIncorrectPrediction = () => {
    setPredictedFood(null);  // Clear the prediction
    setShowForm(false);  // Hide the form
    alert("Please take a new picture of your food.");
  };

  const handleManualSubmit = () => {
    setShowSimpleForm(true);
    setShowForm(false);
    setPredictedFood(null);
    setFoodName('');
    stopCamera();
  };

  const handleSimpleFormSubmit = async (event) => {
    event.preventDefault();
    if (!foodName.trim()) {
      showCustomAlert(t('please_enter_food_name'));
      return;
    }

    try {
      setIsLoading(true); // Show loading state

      const formData = new FormData();
      formData.append('food_name', foodName.trim());

      const response = await fetch(`${BASE_URL}/process-food-text`, {
        method: 'POST',
        body: formData,
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Accept-Language': i18n.language // Send current language
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.food_name) {
        // Parse the response similar to image processing
        const predictionParts = result.food_name.split(',');
        const detectedFood = predictionParts[0];
        const caloriesMatch = predictionParts[1].match(/(\d+\.?\d*)/);
        const caloriesPerGram = caloriesMatch ? parseFloat(caloriesMatch[0]) : 0;

        console.log("Extracted Food Name:", detectedFood);
        console.log("Extracted Calories:", caloriesPerGram);

        setFoodName(detectedFood);
        setFoodCalories(caloriesPerGram);
        setShowSimpleForm(false);
        setShowForm(true);
      } else {
        showCustomAlert(t('food_detection_failed'));
      }
    } catch (error) {
      console.error('Error:', error);
      showCustomAlert(t('error_processing_food'));
      setFoodName('');
      setFoodCalories('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFoodNameChange = (e) => {
    const selectedFoodName = e.target.value;
    setFoodName(selectedFoodName);
    
    // Find matching food and update calories
    const selectedFood = foodsList.find(food => food.name === selectedFoodName);
    if (selectedFood) {
      setFoodCalories(selectedFood.calories);
    }
  };

  const showCustomAlert = (message) => {
    setAlertMessage(message);
    setShowAlert(true);
  };

  const saveUserRecipe = async () => {
    if (!recipeName || !foodCalories) {
      showCustomAlert('Please enter a recipe name and ensure calories are calculated');
      return;
    }

    const userId = localStorage.getItem('user_id');
    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('food_name', recipeName);
    formData.append('calories', foodCalories);

    try {
      const response = await fetch(`${BASE_URL}/api/save-user-food`, {
        method: 'POST',
        body: formData,
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });
      
      const data = await response.json();
      if (data.success) {
        showCustomAlert(data.message);
        // Refresh user foods
        const userFoodsRes = await fetch(`${BASE_URL}/api/user-foods/${userId}`, {
          headers: {
            'ngrok-skip-browser-warning': 'true'
          }
        });
        const userFoodsData = await userFoodsRes.json();
        setUserFoods(userFoodsData.foods);
      }
    } catch (error) {
      console.error('Error saving user recipe:', error);
    }
  };

  const saveUserFood = async () => {
    if (!foodName || !foodCalories) {
      showCustomAlert(t('please_enter_food_calories'));
      return;
    }

    const userId = localStorage.getItem('user_id');
    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('food_name', foodName);
    formData.append('calories', foodCalories);

    try {
      const response = await fetch(`${BASE_URL}/api/save-user-food`, {
        method: 'POST',
        body: formData,
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });
      
      const data = await response.json();
      if (data.success) {
        showCustomAlert(t('error_saving_food'));
        // Refresh the foods list
        const userFoodsRes = await fetch(`${BASE_URL}/api/user-foods/${userId}`, {
          headers: {
            'ngrok-skip-browser-warning': 'true'
          }
        });
        const userFoodsData = await userFoodsRes.json();
        setUserFoods(userFoodsData.foods);
        setFoodsAndCalories(prev => [...prev, ...userFoodsData.foods]);
      }
    } catch (error) {
      showCustomAlert(t('error_saving_food'));
      console.error('Error:', error);
    }
  };

  const handleUpdateTotalCalories = (total) => {
    setTodayTotal(total);
  };

  // Add an "Apply" button to the form
  const handleApply = () => {
    // Logic to handle the application of the form data
    console.log('Apply button clicked');
    // You can add any additional logic needed when the "Apply" button is clicked
  };

  // Add language switcher function
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const handleManualInput = () => {
    setShowForm(true);
    setFoodName('');  // Reset the food name input
  };

  const handleRecipesInput = () => {
    setShowRecipesForm(true);
    setShowForm(false);
    setPredictedFood(null);
    setFoodName('');
    stopCamera();
  };

  const handleRecipesFormSubmit = (event) => {
    event.preventDefault();
    
    const selectedFood = userFoods.find(food => food.name === foodName);
    
    if (selectedFood) {
      setFoodName(selectedFood.name);
      setFoodCalories(selectedFood.calories_per_gram || selectedFood.calories);
      setShowRecipesForm(false);
      setShowForm(true);
    } else {
      showCustomAlert(t('please_select_valid_food'));
    }
  };

  const fetchIngredients = async (foodName) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/process-food-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ foodName, language: i18n.language })
      });
      const data = await response.json();
      setIngredients(data.ingredients || []); // Ensure ingredients is an array
    } catch (error) {
      console.error('Error fetching ingredients:', error);
      setIngredients([]); // Fallback to an empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (ingredients.length > 0) {
      const totalCalories = ingredients.reduce((sum, ing) => sum + (ing.calories * ing.amount), 0);
      const totalAmount = ingredients.reduce((sum, ing) => sum + ing.amount, 0);
      setCalculatedCalories(totalAmount ? totalCalories / totalAmount : 0);
    } else {
      setCalculatedCalories(0);
    }
  }, [ingredients]);

  const handleIngredientChange = (index, field, value) => {
    const updatedIngredients = [...ingredients];
    updatedIngredients[index][field] = field === 'name' ? value : parseFloat(value) || 0;
    setIngredients(updatedIngredients);
  };

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { name: '', calories: 0, amount: 0 }]);
  };

  const handleRemoveIngredient = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleAddIntake = () => {
    setShowForm(true);
  };

  const handleFoodNameSubmit = (e) => {
    e.preventDefault();
    if (foodName.trim()) {
      fetchIngredients(foodName);
    }
  };

  // Function to fetch food data
  const fetchFoodData = async (foodName) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('food_name', foodName);
      formData.append('accept_language', i18n.language);

      const response = await fetch(`${BASE_URL}/process-food-text`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to fetch food data');
      }

      const data = await response.json();

      if (data.success) {
        if (data.ingredients) {
          // Handle not raw food
          setIsRawFood(false);
          setIngredients(data.ingredients || []);
        } else {
          // Handle raw food
          setIsRawFood(true);
          setFoodName(data.food_name || '');
          setFoodCalories(data.nutritional_values || '');
          setIngredients([]);
        }
      }
    } catch (error) {
      console.error('Error fetching food data:', error);
      setIngredients([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isLoading && <LoadingScreen />}
      <div className="home-container">
        <div className="header-banner" style={{ 
          padding: '10px',
          backgroundColor: '#000000',
          color: 'white'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <img 
              src={logo} 
              alt="Logo" 
              className="logo" 
              style={{ width: '100px', height: 'auto' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <select 
                onChange={(e) => changeLanguage(e.target.value)}
                value={i18n.language}
                style={{
                  padding: '5px',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  border: 'none'
                }}
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="it">Italiano</option>
                <option value="ar">العربية</option>
                <option value="sv">Svenska</option>
                <option value="de">Deutsch</option>
                <option value="nl">Nederlands</option>
                <option value="fr">Français</option>
                <option value="fa">فارسی</option>
                <option value="fi">Suomi</option>
                <option value="da">Dansk</option>
                <option value="el">Ελληνικά</option>
                <option value="ru">Русский</option>
                <option value="tr">Türkçe</option>
                <option value="pt">Português</option>
                <option value="ja">日本語</option>
                <option value="hi">हिंदी</option>
                <option value="ku">کوردی</option>
              </select>
              <div style={{ textAlign: 'right' }}>
                <h2 style={{ fontSize: '16px', margin: '0' }}>{t('welcome')}, {username}</h2>
                <p style={{ fontSize: '12px', margin: '0' }}>
                  {t('calories_limit')}: <span style={{ color: 'red' }}>{todayRequiredCalories}</span>
                </p>
                <p style={{ fontSize: '12px', margin: '0' }}>
                  {t('consumed_today')}: <span style={{ color: todayTotal > todayRequiredCalories ? 'red' : 'green' }}>
                    {todayTotal}
                  </span>
                </p>
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right', marginTop: '1px' }}>
            <img 
              src={(() => {
                const ratio = todayTotal / todayRequiredCalories;  // Changed from todayConsumed to todayTotal
                if (ratio <= 0.15) return "/1.png";
                if (ratio <= 0.3) return "/2.png";
                if (ratio <= 0.45) return "/3.png";
                if (ratio <= 0.6) return "/4.png";
                if (ratio <= 0.75) return "/5.png";
                if (ratio <= 1) return "/6.png";
                if (ratio <= 1.1) return "/7.png";
                if (ratio <= 1.2) return "/8.png";
                if (ratio <= 1.3) return "/9.png";
                return "/10.png";
              })()}
              alt="Calorie Estimation"
              style={{ width: '180px', height: 'auto' }}
            />
          </div>
        </div>
        <div className="main-content" style={{ paddingBottom: '60px' }}>
          {/* Add the image under the menu bar */}
         
          {activeSection === 'newInput' && (
            <div className="detect-food-section">
              <h3>{t('register_intake')}</h3>
              <div className="button-group">
                <button onClick={startCamera} className="primary-button">
                  <FontAwesomeIcon icon={faCamera} />
                  {t('capture_image')}
                </button>
                <label htmlFor="file-upload" className="primary-button">
                  <FontAwesomeIcon icon={faUpload} />
                  {t('upload_file')}
                </label>
                <input id="file-upload" type="file" accept="image/*" onChange={handleUpload} className="file-input" />
                <button onClick={handleManualSubmit} className="primary-button">
                  <FontAwesomeIcon icon={faKeyboard} />
                  {t('manual_input')}
                </button>
                <button onClick={handleRecipesInput} className="primary-button">
                  <FontAwesomeIcon icon={faBook} />
                  {t('input_from_recipes')}
                </button>
              </div>
              {showAlert && (
                <CustomAlert 
                  message={alertMessage}
                  onClose={() => setShowAlert(false)}
                />
              )}
            </div>
          )}

          {activeSection === 'history' && (
            <IntakeTable 
              userId={userId} 
              requiredCalories={todayRequiredCalories}
              onUpdateTotalCalories={handleUpdateTotalCalories}  // Use this instead of setTotalConsumedCaloriesToday
            />
          )}

          {activeSection === 'myRecipes' && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '20px',
              margin: '20px auto',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              maxWidth: '320px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h3 style={{ margin: 0, fontSize: '20px' }}>{t('my_recipes')}</h3>
                <div>
                  <button 
                    onClick={() => setShowCalorieCalculator(true)}
                    style={{
                      backgroundColor: '#34C759',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '14px',
                      marginRight: '8px'
                    }}
                  >
                    {t('add_food')}
                  </button>
                  <button 
                    onClick={() => setActiveSection('newInput')}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      padding: '6px'
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Keep your existing mapping logic, just update the style of each item */}
              {userFoods.map((food, index) => (
                <div 
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    backgroundColor: index % 2 === 0 ? '#f5f5f5' : 'white',
                    borderRadius: '8px',
                    marginBottom: '8px'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '500' }}>{food.name}</div>
                    <div style={{ color: '#666', fontSize: '14px' }}>
                      {food.calories_per_gram || food.calories} {t('calories_per_gram')}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteFood(food.id)}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: '#ff3b30',
                      cursor: 'pointer',
                      padding: '8px'
                    }}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeSection === 'profile' && (
            <Profile userId={userId} />
          )}

          {cameraIsOpen && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 1000,
              backgroundColor: 'black'
            }}>
              <div style={{
                position: 'absolute',
                top: '20px',
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'center',
                gap: '10px',
                zIndex: 1001,
                padding: '0 20px'
              }}>
                <button 
                  onClick={takePhoto}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#34C759',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                >
                  {t('open_camera')}
                </button>
                <button 
                  onClick={stopCamera}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#ff3b30',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                >
                  {t('close_camera')}
                </button>
              </div>
              <video 
                ref={videoElement}
                autoPlay
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </div>
          )}

          {isProcessing && (
            <div className="processing-message">
              {t('processing_image')}
            </div>
          )}

          {predictedFood && (
            <div className="prediction-result">
              <h3>{t('detected_food')}:</h3>
              <p><strong>{t('detected_food_name')}:</strong> {predictedFood.name}</p>
              <p><strong>{t('detected_calories')}:</strong> {predictedFood.calories} kcal</p>
              <p><strong>{t('detected_confidence')}:</strong> {(predictedFood.confidence * 100).toFixed(1)}%</p>
              
              <div className="prediction-actions">
                <button 
                  onClick={handleCorrectPrediction} 
                  className="primary-button"
                >
                  {t('add_intake')}
                </button>
                <button 
                  onClick={handleIncorrectPrediction} 
                  className="secondary-button"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          )}

          {showForm && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              width: '100%'
            }}>
              <form onSubmit={handleFormSubmit} style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '20px',
                margin: '20px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                width: '100%',
                maxWidth: '320px'
              }}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    color: '#666',
                    marginBottom: '8px'
                  }}>
                    {t('food_name')}
                  </label>
                  <input
                    type="text"
                    value={foodName}
                    onChange={(e) => setFoodName(e.target.value)}
                    placeholder="Enter food name"
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '16px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      backgroundColor: '#f5f5f5'
                    }}
                    required
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    color: '#666',
                    marginBottom: '8px'
                  }}>
                    {t('calories_per_gram')}
                  </label>
                  <input
                    type="number"
                    value={foodCalories}
                    onChange={(e) => setFoodCalories(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '16px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      backgroundColor: '#f5f5f5'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    color: '#666',
                    marginBottom: '8px'
                  }}>
                    {t('amount_consumed')}
                  </label>
                  <input
                    type="number"
                    value={count}
                    onChange={(e) => setCount(e.target.value)}
                    required
                    min="1"
                    step="1"
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '16px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      backgroundColor: '#f5f5f5'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    color: '#666',
                    marginBottom: '8px'
                  }}>
                    {t('date')}
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '16px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      backgroundColor: '#f5f5f5'
                    }}
                  />
                </div>

                <div style={{
                  display: 'flex',
                  gap: '10px',
                  marginTop: '30px'
                }}>
                  <button 
                    type="submit" 
                    style={{
                      flex: '1',
                      padding: '14px',
                      backgroundColor: '#34C759',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    {t('add_food')}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowForm(false)}
                    style={{
                      flex: '1',
                      padding: '14px',
                      backgroundColor: '#ff3b30',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    {t('cancel')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {showCalorieCalculator && (
            <div className="modal-overlay">
              <div className="calculator-modal">
                <h3>{t('add_new_food')}</h3>
                
                {!showCalculationResult ? (
                  // Calculator Input Form
                  <>
                    {ingredients.map((ingredient, index) => (
                      <div key={index} className="ingredient-row">
                        <div className="form-group">
                          <label>{t('ingredient_label')}</label>
                          <input
                            type="text"
                            list="ingredients-list"
                            value={ingredient.name}
                            onChange={(e) => {
                              const newIngredients = [...ingredients];
                              newIngredients[index].name = e.target.value;
                              const selectedFood = foodsAndCalories.find(food => food.name === e.target.value);
                              if (selectedFood) {
                                newIngredients[index].calories = selectedFood.calories;
                              }
                              setIngredients(newIngredients);
                            }}
                          />
                          <datalist id="ingredients-list">
                            {foodsAndCalories.map((food, i) => (
                              <option key={i} value={food.name} />
                            ))}
                          </datalist>
                        </div>
                        
                        <div className="form-group">
                          <label>{t('calories_label')}</label>
                          <input
                            type="number"
                            value={ingredient.calories}
                            onChange={(e) => {
                              const newIngredients = [...ingredients];
                              newIngredients[index].calories = parseFloat(e.target.value) || 0;
                              setIngredients(newIngredients);
                            }}
                            min="0"
                            step="0.1"
                          />
                        </div>
                        
                        <div className="form-group">
                          <label>{t('amount_label')}</label>
                          <input
                            type="number"
                            value={ingredient.amount}
                            onChange={(e) => {
                              const newIngredients = [...ingredients];
                              newIngredients[index].amount = parseFloat(e.target.value) || 0;
                              setIngredients(newIngredients);
                            }}
                            min="0"
                            step="1"
                          />
                        </div>
                        
                        {ingredients.length > 1 && (
                          <button 
                            type="button"
                            onClick={() => {
                              setIngredients(ingredients.filter((_, i) => i !== index));
                            }}
                            className="remove-btn"
                          >
                            {t('remove')}
                          </button>
                        )}
                      </div>
                    ))}
                    
                    <button 
                      type="button"
                      onClick={() => setIngredients([...ingredients, { name: '', calories: 0, amount: 0 }])}
                      className="add-row-btn"
                    >
                      {t('add_new_ingredient')}
                    </button>

                    <div className="save-recipe-section">
                      <div className="form-group">
                        <label>{t('food_name_label')}</label>
                        <input
                          type="text"
                          value={recipeName}
                          onChange={(e) => setRecipeName(e.target.value)}
                          placeholder={t('enter_food_name')}
                          className="recipe-name-input"
                          required
                        />
                      </div>
                    </div>

                    <div className="calculator-buttons">
                      <button 
                        type="button"
                        onClick={() => {
                          if (!recipeName.trim()) {
                            showCustomAlert(t('please_enter_food_name'));
                            return;
                          }

                          // Calculate total calories and total amount
                          const totalAmount = ingredients.reduce((sum, ing) => sum + ing.amount, 0);
                          const totalCaloriesWeighted = ingredients.reduce((sum, ing) => 
                            sum + (ing.calories * ing.amount), 0);
                          
                          if (totalAmount === 0) {
                            showCustomAlert(t('please_add_ingredients'));
                            return;
                          }

                          const caloriesPerGram = totalCaloriesWeighted / totalAmount;
                          setCalculatedCalories(caloriesPerGram);
                          setShowCalculationResult(true);
                        }}
                        className="calculate-btn"
                      >
                        {t('calculate')}
                      </button>
                      
                      <button 
                        type="button"
                        onClick={() => {
                          setShowCalorieCalculator(false);
                          setRecipeName('');
                          setIngredients([{ name: '', calories: 0, amount: 0 }]);
                          setShowCalculationResult(false);
                        }}
                        className="cancel-btn"
                      >
                        {t('cancel')}
                      </button>
                    </div>
                  </>
                ) : (
                  // Calculation Result View
                  <div className="calculation-result">
                    <h4>{t('calculation_result')}</h4>
                    <div className="result-details">
                      <p><strong>{t('food_name_label')}</strong> {recipeName}</p>
                      <p><strong>{t('calories_per_gram')}</strong> {calculatedCalories.toFixed(2)}</p>
                      <p className="ingredients-summary">
                        <strong>{t('ingredients_summary')}</strong>
                        <ul>
                          {ingredients.map((ing, index) => (
                            ing.name && ing.amount > 0 && (
                              <li key={index}>
                                {ing.name}: {ing.amount}g ({ing.calories} {t('calories_per_gram')})
                              </li>
                            )
                          ))}
                        </ul>
                      </p>
                    </div>
                    
                    <div className="calculator-buttons">
                      <button 
                        type="button"
                        onClick={saveUserFood}
                        className="save-btn"
                      >
                        {t('add_food')}
                      </button>
                      
                      <button 
                        type="button"
                        onClick={() => setShowCalculationResult(false)}
                        className="edit-btn"
                      >
                        {t('edit')}
                      </button>
                      
                      <button 
                        type="button"
                        onClick={() => {
                          setShowCalorieCalculator(false);
                          setRecipeName('');
                          setIngredients([{ name: '', calories: 0, amount: 0 }]);
                          setShowCalculationResult(false);
                        }}
                        className="cancel-btn"
                      >
                        {t('cancel')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {showMyRecipes && (
            <MyRecipes onClose={() => setShowMyRecipes(false)} />
          )}

          {showSimpleForm && (
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
              <form onSubmit={handleFoodNameSubmit} style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '20px',
                margin: '20px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                width: '100%',
                maxWidth: '320px'
              }}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                    Enter Food Name
                  </label>
                  <input
                    type="text"
                    value={foodName}
                    onChange={(e) => setFoodName(e.target.value)}
                    placeholder="Food Name"
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '16px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      backgroundColor: '#f5f5f5'
                    }}
                    required
                  />
                  <button type="submit" style={{
                    marginTop: '10px',
                    padding: '10px 20px',
                    backgroundColor: '#34C759',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    cursor: 'pointer'
                  }}>
                    Fetch Food Data
                  </button>
                </div>
                {isLoading && <p>Loading...</p>}
                {isRawFood ? (
                  <div>
                    <p><strong>Food Name:</strong> {foodName}</p>
                    <p><strong>Calories:</strong> {foodCalories} cal/g</p>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Amount"
                      style={{ width: '100%', marginBottom: '10px' }}
                    />
                    <button type="button" onClick={handleAddIntake}>Add Intake</button>
                  </div>
                ) : (
                  ingredients.map((ingredient, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                      <input
                        type="text"
                        value={ingredient.name}
                        onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                        placeholder="Ingredient"
                        style={{ flex: 1, marginRight: '10px' }}
                      />
                      <input
                        type="number"
                        value={ingredient.calories}
                        onChange={(e) => handleIngredientChange(index, 'calories', e.target.value)}
                        placeholder="Calories/g"
                        style={{ width: '80px', marginRight: '10px' }}
                      />
                      <input
                        type="number"
                        value={ingredient.amount}
                        onChange={(e) => handleIngredientChange(index, 'amount', e.target.value)}
                        placeholder="Amount"
                        style={{ width: '80px', marginRight: '10px' }}
                      />
                      <button type="button" onClick={() => handleRemoveIngredient(index)}>Remove</button>
                    </div>
                  ))
                )}
                {!isRawFood && (
                  <>
                    <button type="button" onClick={handleAddIngredient}>Add Ingredient</button>
                    <div style={{ marginTop: '20px' }}>
                      <strong>Total Calories: </strong>{calculatedCalories.toFixed(2)}
                    </div>
                    <button type="button" onClick={handleAddIntake} style={{ marginTop: '20px' }}>Add Intake</button>
                  </>
                )}
              </form>
            </div>
          )}

          {showRecipesForm && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              width: '100%'
            }}>
              <form onSubmit={handleRecipesFormSubmit} style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '20px',
                margin: '20px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                width: '100%',
                maxWidth: '320px'
              }}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    color: '#666',
                    marginBottom: '8px',
                    textAlign: 'center'
                  }}>
                    {t('select_food')}
                  </label>
                  
                  <ReactAutocomplete
                    value={foodName}
                    items={userFoods}
                    getItemValue={item => item.name}
                    onChange={(e, value) => {
                      console.log("Input changed:", e.target.value);
                      setFoodName(e.target.value);
                    }}
                    onSelect={(value, item) => {
                      console.log("Selected item:", item);
                      setFoodName(item.name);
                      setFoodCalories(item.calories);
                    }}
                    renderInput={(props) => (
                      <input
                        {...props}
                        style={{
                          width: '100%',
                          padding: '12px',
                          fontSize: '16px',
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          backgroundColor: '#f5f5f5'
                        }}
                        placeholder={t('enter_food_name')}
                      />
                    )}
                    renderMenu={(items, value, style) => (
                      <div style={{
                        ...style,
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        zIndex: 1000,
                        backgroundColor: 'white',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        marginTop: '4px',
                        maxHeight: '200px',
                        overflowY: 'auto'
                      }}>
                        {items}
                      </div>
                    )}
                    renderItem={(item, isHighlighted) => (
                      <div
                        key={item.name}
                        style={{
                          padding: '10px 12px',
                          backgroundColor: isHighlighted ? '#f5f5f5' : 'white',
                          cursor: 'pointer',
                          borderBottom: '1px solid #eee'
                        }}
                      >
                        {item.name}
                      </div>
                    )}
                    shouldItemRender={(item, value) => 
                      item.name.toLowerCase().indexOf(value.toLowerCase()) > -1
                    }
                    wrapperStyle={{
                      position: 'relative',
                      display: 'inline-block',
                      width: '100%'
                    }}
                  />
                </div>

                <div style={{
                  display: 'flex',
                  gap: '10px',
                  marginTop: '30px'
                }}>
                  <button 
                    type="submit" 
                    className="primary-button"
                    disabled={!foodName}
                    style={{
                      flex: '1',
                      padding: '14px',
                      backgroundColor: foodName ? '#34C759' : '#ccc',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '500',
                      cursor: foodName ? 'pointer' : 'not-allowed'
                    }}
                  >
                    {t('next')}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowRecipesForm(false)}
                    style={{
                      flex: '1',
                      padding: '14px',
                      backgroundColor: '#ff3b30',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    {t('cancel')}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
        <div className="menu-list">
          <li 
            onClick={() => setActiveSection('newInput')} 
            className={`menu-item ${activeSection === 'newInput' ? 'active' : ''}`}
            style={{ 
              listStyle: 'none',
              color: activeSection === 'newInput' ? '#34C759' : '#8E8E93',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <FontAwesomeIcon icon={faPlus} />
            <span style={{ fontSize: '10px' }}>{t('add')}</span>
          </li>
          <li 
            onClick={() => setActiveSection('history')} 
            className={`menu-item ${activeSection === 'history' ? 'active' : ''}`}
            style={{ 
              listStyle: 'none',
              color: activeSection === 'history' ? '#34C759' : '#8E8E93',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <FontAwesomeIcon icon={faListAlt} />
            <span style={{ fontSize: '10px' }}>{t('log')}</span>
          </li>
          <li 
            onClick={() => setActiveSection('myRecipes')} 
            className={`menu-item ${activeSection === 'myRecipes' ? 'active' : ''}`}
            style={{ 
              listStyle: 'none',
              color: activeSection === 'myRecipes' ? '#34C759' : '#8E8E93',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <FontAwesomeIcon icon={faBook} />
            <span style={{ fontSize: '10px' }}>{t('recipes')}</span>
          </li>
          <li 
            onClick={() => setActiveSection('profile')} 
            className={`menu-item ${activeSection === 'profile' ? 'active' : ''}`}
            style={{ 
              listStyle: 'none',
              color: activeSection === 'profile' ? '#34C759' : '#8E8E93',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <FontAwesomeIcon icon={faCog} />
            <span style={{ fontSize: '10px' }}>{t('profile')}</span>
          </li>
          <li 
            onClick={handleLogout} 
            className="menu-item logout"
            style={{ 
              listStyle: 'none',
              color: '#8E8E93'  // Always gray since it's not an active state
            }}
          >
            <FontAwesomeIcon icon={faSignOutAlt} />
          </li>
        </div>
      </div>
      {showAlert && (
        <CustomAlert 
          message={alertMessage}
          onClose={() => setShowAlert(false)}
        />
      )}
    </>
  );
};

export default Home;


