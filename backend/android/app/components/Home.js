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
  const [ingredients, setIngredients] = useState([{ name: '', calories: 0, amount: 0 }]);
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
  const [ingredientsForm, setIngredientsForm] = useState([]); // New state for ingredients form
  const [showIngredientsForm, setShowIngredientsForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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
    fetch(`${BASE_URL}/api/user-foods/${userId}`, {
      headers: {
        'ngrok-skip-browser-warning': 'true'
      }
    })
      .then(response => response.json())
      .then(data => {
        setUserFoods(data.foods);
        // Update foodsAndCalories to include user foods
        setFoodsAndCalories(prev => [...prev, ...data.foods]);
      })
      .catch(error => console.error('Error fetching user foods:', error));
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
    try {
      if (!videoElement.current || !streamRef.current) {
        throw new Error('Camera not initialized');
      }

      const canvas = document.createElement('canvas');
      canvas.width = videoElement.current.videoWidth;
      canvas.height = videoElement.current.videoHeight;
      
      const context = canvas.getContext('2d');
      context.drawImage(videoElement.current, 0, 0);
      
      const dataUrl = canvas.toDataURL('image/jpeg');
      
      // Stop the camera after taking photo
      stopCamera();
      
      // Process the photo
      await processPhoto(dataUrl);
    } catch (error) {
      console.error('Error taking photo:', error);
      showCustomAlert(t('Photo error'));
    }
  };

  const processPhoto = async (photoData) => {
    try {
      setIsLoading(true);
      const formData = new FormData();
      
      // Convert base64 to blob
      const response = await fetch(photoData);
      const blob = await response.blob();
      formData.append('image', blob, 'photo.jpg');

      const apiResponse = await fetch(`${BASE_URL}/process-food-image`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept-Language': i18n.language,
          'ngrok-skip-browser-warning': 'true'
        },
      });

      const result = await apiResponse.json();
      console.log('API Response:', result);

      if (!apiResponse.ok) {
        throw new Error(result.detail || 'Error processing image');
      }

      if (result.success) {
        if (result.ingredients && Array.isArray(result.ingredients)) {
          console.log('Setting ingredients:', result.ingredients);
          setFoodName(result.food_name);
          setIngredientsForm(result.ingredients);
          setShowIngredientsForm(true);
          setShowSimpleForm(false);
          setShowForm(false);
          setCalculatedCalories(calculateCalories(result.ingredients));
        } else if (result.nutritional_values && result.nutritional_values.calories) {
          setFoodName(result.food_name);
          setFoodCalories(Number(result.nutritional_values.calories) || 0);
          setShowForm(true);
          setShowSimpleForm(false);
          setShowIngredientsForm(false);
        } else {
          throw new Error('Invalid response format');
        }
      } else {
        showCustomAlert(t('Food detection failed'));
      }
    } catch (error) {
      console.error('Error processing photo:', error);
      showCustomAlert(t('Error processing photo'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (event) => {
    try {
      const file = event.target.files[0];
      if (!file) {
        return;
      }

      // Create a data URL from the file
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target.result;
        await processPhoto(dataUrl);  // Use the existing processPhoto function
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error handling upload:', error);
      showCustomAlert(t('Photo error'));
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
      
      if (result.success) {
        if (result.ingredients && Array.isArray(result.ingredients)) {
          console.log('Setting ingredients:', result.ingredients);
          setFoodName(result.food_name);
          setIngredientsForm(result.ingredients);
          setShowIngredientsForm(true);
          setShowSimpleForm(false);
          setShowForm(false);
          setCalculatedCalories(calculateCalories(result.ingredients));
        } else if (result.nutritional_values && result.nutritional_values.calories) {
          setFoodName(result.food_name);
          setFoodCalories(Number(result.nutritional_values.calories) || 0);
          setShowForm(true);
          setShowSimpleForm(false);
          setShowIngredientsForm(false);
        } else {
          throw new Error('Invalid response format');
        }
      } else {
        showCustomAlert(t('food_detection_failed'));
      }
    } catch (error) {
      console.error('Error processing photo:', error);
      showCustomAlert(t('error_processing_photo'));
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



    const userId = localStorage.getItem('user_id');
    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('food_name', foodName);
    formData.append('calories', foodCalories);
    console.log("Form data:", formData);

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
            showCustomAlert('Food saved successfully!');
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
        showCustomAlert('Error saving food');
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

  // Function to calculate calories
  const calculateCalories = (ingredients) => {
    const totalCalories = ingredients.reduce((total, ingredient) => {
      const calories = parseFloat(ingredient.calories) || 0;
      const amount = parseFloat(ingredient.amount) || 0;
      return total + (calories * amount);
    }, 0);

    const totalAmount = ingredients.reduce((total, ingredient) => {
      return total + (parseFloat(ingredient.amount) || 0);
    }, 0);

    return totalAmount > 0 ? totalCalories / totalAmount : 0;
  };

  // Function to handle adding a new ingredient row
  const addIngredientRow = () => {
    setIngredientsForm([...ingredientsForm, { name: '', calories: 0, amount: 0 }]);
  };

  // Function to handle removing an ingredient row
  const removeIngredientRow = (index) => {
    setIngredientsForm(ingredientsForm.filter((_, i) => i !== index));
  };

  // Function to handle ingredient changes
  const handleIngredientChange = (index, field, value) => {
    const updatedIngredients = [...ingredientsForm];
    updatedIngredients[index][field] = value;
    setIngredientsForm(updatedIngredients);
    setCalculatedCalories(calculateCalories(updatedIngredients));
  };

  // Function to handle the submission of the ingredients form
  const handleAddIntakeFromIngredients = () => {
    setFoodName(foodName); // Assuming recipeName contains the food name
    setFoodCalories(calculatedCalories);  
    setShowForm(true);
    setShowIngredientsForm(false);
  };

  const processFoodData = async () => {
    try {
      const response = await fetch('/process-food-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ food_name: foodName }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      console.log('Fetched data:', data); // Add this log

      if (data.success) {
        if (data.ingredients) {
          setIngredientsForm(data.ingredients);
          setCalculatedCalories(calculateCalories(data.ingredients));
          setShowIngredientsForm(true);
        } else {
          setFoodName(data.food_name);
          setFoodCalories(data.calories);
          setShowForm(true);
        }
      } else {
        showCustomAlert(t('error_processing_food'));
      }
    } catch (error) {
      showCustomAlert(t('error_processing_food'));
      console.error('Error processing food:', error);
    }
  };

  const handleCalculationComplete = (name, calories) => {
    console.log("Received Name:", name);
    console.log("Received Calories:", calories);
    setFoodName(name);
    setFoodCalories(calories);
  };

  // Modify saveFood to accept calories as a parameter
  const saveFood = (calories) => {
    const userId = localStorage.getItem('user_id');
    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('food_name', recipeName);
    formData.append('calories', calories);

    console.log("Sending Calories:", calories); // Log before sending
    console.log("Food Name:", recipeName); // Log before sending

    fetch(`${BASE_URL}/api/save-user-food`, {
      method: 'POST',
      body: formData,
      headers: {
        'ngrok-skip-browser-warning': 'true'
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        console.log('Food saved successfully!');
        alertMessage('New food saved successfully!');
        setShowForm(false); // Hide the form
      } else {
        console.error('Error saving food:', data.message);
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });
  };

  // Add this function after the fetchRecipes function and before handleLogout
  const handleDeleteFood = async (foodName) => {
    try {
      console.log("Attempting to delete food:", foodName);
      const response = await fetch(`${BASE_URL}/api/user-foods/${userId}/${foodName}`, {
        method: 'DELETE',
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });

      if (response.ok) {
        showCustomAlert('Food deleted successfully');
        // Refresh the foods list after deletion
        const userFoodsRes = await fetch(`${BASE_URL}/api/user-foods/${userId}`, {
          headers: {
            'ngrok-skip-browser-warning': 'true'
          }
        });
        const userFoodsData = await userFoodsRes.json();
        setUserFoods(userFoodsData.foods);
        setFoodsAndCalories(prev => {
          // Remove the deleted food and keep all others
          return prev.filter(food => food.name !== foodName);
        });
      } else {
        showCustomAlert('Error deleting food');
      }
    } catch (error) {
      console.error('Error deleting food:', error);
      showCustomAlert('Error deleting food');
    }
  };

  return (
    <>
      {isLoading && <LoadingScreen />}
      <div className="home-container">
        {successMessage && <div className="success-message">{successMessage}</div>}
        <div className="header-banner" style={{ 
          padding: '10px',
          backgroundColor: '#000000',
          color: 'white'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <img 
                src={logo} 
                alt="Logo" 
                className="logo" 
                style={{ width: '175px', height: 'auto' }}
              />
              <select 
                onChange={(e) => changeLanguage(e.target.value)}
                value={i18n.language}
                style={{
                  padding: '5px',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  border: 'none',
                  width: '100px'
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
            </div>
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
                    {t('Add Recipe')}
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
                    onClick={() => handleDeleteFood(food.name)}
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
                  {t('Capture Image')}
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
                    {t('add_intake')}
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
                <h3>{t('Add_new_receipe')}</h3>
                
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
                            <FontAwesomeIcon icon={faTrash} />
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

                          const totalAmount = ingredients.reduce((sum, ing) => sum + ing.amount, 0);
                          const totalCaloriesWeighted = ingredients.reduce((sum, ing) => 
                            sum + (ing.calories * ing.amount), 0);
                          
                          if (totalAmount === 0) {
                            showCustomAlert(t('Please add ingredients'));
                            return;
                          }

                          const caloriesPerGram = totalCaloriesWeighted / totalAmount;
                          setCalculatedCalories(caloriesPerGram);

                          console.log("Recipe Name:", recipeName);
                          console.log("Calculated Calories per Gram:", caloriesPerGram);

                          setShowCalculationResult(true);

                          // Pass the calculated value directly
                          saveFood(caloriesPerGram);
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
                        onClick={() => {
                          saveUserFood();
                          setShowCalculationResult(false);
                          setShowCalorieCalculator(false);
                        }}
                        className="save-btn"
                      >
                        {t('Add Recipe')}
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
            <MyRecipes onClose={() => setShowMyRecipes(false)} onCalculationComplete={handleCalculationComplete} />
          )}

          {showSimpleForm && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              width: '100%'
            }}>
              <form onSubmit={handleSimpleFormSubmit} style={{
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
                    placeholder={t('enter_food_name')}
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
                    {t('next')}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowSimpleForm(false)}
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

          {showIngredientsForm && (
            <div className="ingredients-form">
              <h3>{foodName}</h3>
              <h3>{t('Edit ingredients')}</h3>
              {ingredientsForm.map((ingredient, index) => (
                <div key={index} className="ingredient-row">
                  <div className="form-group">
                    <label>Ingredient:</label>
                    <input
                      type="text"
                      value={ingredient.name}
                      onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                      placeholder={t('ingredient_name')}
                    />
                  </div>
                  <div className="form-group">
                    <label>Calories/g:</label>
                    <input
                      type="number"
                      value={ingredient.calories}
                      onChange={(e) => handleIngredientChange(index, 'calories', parseFloat(e.target.value))}
                      placeholder={t('Calories per gram')}
                    />
                  </div>
                  <div className="form-group">
                    <label>Amount (g):</label>
                    <input
                      type="number"
                      value={ingredient.amount}
                      onChange={(e) => handleIngredientChange(index, 'amount', parseFloat(e.target.value))}
                      placeholder={t('amount')}
                    />
                  </div>
                  {ingredientsForm.length > 1 && (
                    <button onClick={() => removeIngredientRow(index)} className="remove-btn">
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={addIngredientRow} className="add-row-btn">{t('Add ingredient')}</button>
              <div>
                <p>{t('calculated_calories')}: {calculatedCalories.toFixed(2)}</p>
              </div>
              <button onClick={handleAddIntakeFromIngredients} className="primary-button">{t('add_intake')}</button>
              <button onClick={() => setShowIngredientsForm(false)} className="cancel-btn">{t('cancel')}</button>
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


