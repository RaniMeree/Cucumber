import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import IntakeTable, { totalConsumedCaloriesToday } from './IntakeTable';
import Profile from './Profile';  // Add this import
import '../App.css';
import logo from '../assets/logo.png';  
import LoadingScreen from './LoadingScreen';
import CustomAlert from './CustomAlert';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera, faUpload, faKeyboard, faPlus, faListAlt, faCog, faSignOutAlt, faBook, faTrash, faChevronUp, faChevronDown, faEdit, faChartBar, faCalendarAlt, faStar } from '@fortawesome/free-solid-svg-icons';
import MyRecipes from './MyRecipes';
import { useTranslation } from 'react-i18next';
import '../i18n/i18n';
import CalorieProgress from './CalorieProgress';
import Select from 'react-select';
import Charts from './Charts';  // Ensure this import is correct
import Calender from './Calender';  // Ensure this import is correct


const BASE_URL = process.env.REACT_APP_BASE_URL; // Access the base URL
const Home = () => {
  const { t, i18n } = useTranslation();
  const { state } = useLocation();
  const [showIntakeTable, setShowIntakeTable] = useState(false);
  const [showProfile, setShowProfile] = useState(false);  // Add this state

  const [foodsId, setFoodsId] = useState(0);
  const [count, setCount] = useState('');
  const [foodCalories, setFoodCalories] = useState('');
  const [foodCarbs, setFoodCarbs] = useState(0);
  const [foodProtein, setFoodProtein] = useState(0);
  const [foodFats, setFoodFats] = useState(0);
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
  const [ingredientsForm, setIngredientsForm] = useState([{ name: '', calories: 0, amount: 0, carbs: 0, protein: 0, fat: 0 }]); // New state for ingredients form
  const [showIngredientsForm, setShowIngredientsForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [calculatedCarbs, setCalculatedCarbs] = useState(0);
  const [calculatedProtein, setCalculatedProtein] = useState(0);
  const [calculatedFat, setCalculatedFat] = useState(0);  // Changed from calculatedFats
  const [showSaveRecipeModal, setShowSaveRecipeModal] = useState(false);
  const [recipeNameToSave, setRecipeNameToSave] = useState('');
  const [userRecipes, setUserRecipes] = useState([]);
  const [editingRecipeId, setEditingRecipeId] = useState(null);
  const [recipes, setRecipes] = useState([]);
  // Add this state to track the selected date's required calories
  const [selectedDateCalories, setSelectedDateCalories] = useState(todayRequiredCalories);
  // Add these state variables for macros
  const [todayRequiredProtein, setTodayRequiredProtein] = useState(0);
  const [todayRequiredFat, setTodayRequiredFat] = useState(0);
  const [todayRequiredCarbs, setTodayRequiredCarbs] = useState(0);
  // Add this to your state declarations
  const [isProcessingIngredient, setIsProcessingIngredient] = useState(false);
  const [expandedRecipes, setExpandedRecipes] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  // Add new state for health score
  const [healthScore, setHealthScore] = useState(null);
  // First, add a new state to track if any form is visible
  const [isAnyFormVisible, setIsAnyFormVisible] = useState(false);

  const tableHeaderStyle = {
    padding: '12px',
    textAlign: 'left',
    fontWeight: '600',
    fontSize: '0.9rem'
  };

  const tableCellStyle = {
    padding: '12px',
    textAlign: 'left',
    color: '#2c3e50'
  };

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
        // Safely handle the data
        const regularFoods = Array.isArray(foodsData.foods) 
          ? foodsData.foods.map((food, index) => ({
              name: food,
              calories: caloriesData.calories?.[index] || 0,
              carbs: caloriesData.carbs?.[index] || 0,
              protein: caloriesData.protein?.[index] || 0,
              fats: caloriesData.fats?.[index] || 0,
              isPersonal: false
            }))
          : [];
        
        // Safely handle user foods
        const userFoods = Array.isArray(userFoodsData.foods)
          ? userFoodsData.foods.map(food => ({
              ...food,
              isPersonal: true
            }))
          : [];
        
        // Combine both lists
        setFoodsAndCalories([...regularFoods, ...userFoods]);
      })
      .catch(error => {
        console.error('Error fetching foods:', error);
        setFoodsAndCalories([]); // Set empty array on error
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const userId = localStorage.getItem('user_id');
    if (userId) {
      fetch(`${BASE_URL}/daily_user_stats/${userId}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      })
        .then(response => response.json())
        .then(data => {
          // Sort records by date in descending order (newest first)
          const sortedRecords = data.sort((a, b) => new Date(b.date) - new Date(a.date));
          
          // Find the most recent record that is not in the future
          const latestRecord = sortedRecords.find(record => 
            new Date(record.date).toISOString().split('T')[0] <= date
          );
          
          if (latestRecord) {
            const newCalories = Math.round(latestRecord.required_calories);
            setSelectedDateCalories(newCalories);
            
            // Update macros based on the new calories
            setTodayRequiredProtein((newCalories * 0.3) / 4);  // 30% of calories from protein (4 cal/g)
            setTodayRequiredFat((newCalories * 0.25) / 9);     // 25% of calories from fat (9 cal/g)
            setTodayRequiredCarbs((newCalories * 0.45) / 4);   // 45% of calories from carbs (4 cal/g)
          }
        })
        .catch(error => {
          console.error("Error fetching daily stats:", error);
          setSelectedDateCalories(Math.round(requiredCalories));
          // Set default macros based on requiredCalories
          setTodayRequiredProtein((requiredCalories * 0.3) / 4);
          setTodayRequiredFat((requiredCalories * 0.25) / 9);
          setTodayRequiredCarbs((requiredCalories * 0.45) / 4);
        });
    }
  }, [date, requiredCalories]); // Add requiredCalories as a dependency

  useEffect(() => {
    const userId = localStorage.getItem('user_id');
    fetch(`${BASE_URL}/api/user-foods/${userId}`)
      .then(response => response.json())
      .then(data => {
        if (Array.isArray(data.foods)) {
          setUserFoods(data.foods);
          // Update foodsAndCalories to include user foods
          setFoodsAndCalories(prev => [...prev, ...data.foods]);
        } else {
          console.error("Expected an array but got:", data);
          // Handle the error, e.g., show an alert or set a default value
        }
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
      setShowRecipesForm(false);
      setShowSimpleForm(false);
      
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
      
      const response = await fetch(photoData);
      const blob = await response.blob();
      formData.append('image', blob, 'photo.jpg');

      const apiResponse = await fetch(`${BASE_URL}/process-food-image2`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept-Language': i18n.language,
          'ngrok-skip-browser-warning': 'true'
        },
      });

      const result = await apiResponse.json();

      if (!apiResponse.ok) {
        throw new Error(result.detail || 'Error processing image');
      }

      if (result.success) {
        if (result.ingredients && Array.isArray(result.ingredients) && result.ingredients.length > 1) {
          // More than one ingredient - calculate per gram values for each ingredient
          const processedIngredients = result.ingredients.map(ingredient => {
            const amount = parseFloat(ingredient.amount) || 1; // Default to 1 if amount is 0 or invalid
            return {
              ...ingredient,
              calories: (parseFloat(ingredient.calories) / amount) || 0,
              carbs: (parseFloat(ingredient.carbs) / amount) || 0,
              protein: (parseFloat(ingredient.protein) / amount) || 0,
              fat: (parseFloat(ingredient.fat) / amount) || 0
            };
          });

          setFoodName(result.food_name);
          setIngredientsForm(processedIngredients);
          setShowIngredientsForm(true);
          setShowSimpleForm(false);
          setShowForm(false);
          setCalculatedCalories(calculateCalories(processedIngredients));
          setCalculatedCarbs(calculateCarbs(processedIngredients));
          setCalculatedProtein(calculateProtein(processedIngredients));
          setCalculatedFat(calculateFat(processedIngredients));
        } else if (result.ingredients && result.ingredients.length === 1) {
          // Single ingredient - calculate per gram values
          const ingredient = result.ingredients[0];
          const amount = parseFloat(ingredient.amount) || 1; // Default to 1 if amount is 0 or invalid
          
          setFoodName(result.food_name);
          setFoodCalories((parseFloat(ingredient.calories) / amount) || 0);
          setFoodCarbs((parseFloat(ingredient.carbs) / amount) || 0);
          setFoodProtein((parseFloat(ingredient.protein) / amount) || 0);
          setFoodFats((parseFloat(ingredient.fat) / amount) || 0);
          setShowForm(true);
          setShowSimpleForm(false);
          setShowIngredientsForm(false);
        }
      } else {
        showCustomAlert(t('Food detection failed'));
      }
    } catch (error) {
      console.error('Error details:', error);
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

    // Add the missing nutritional values
    formData.append('carbs', parseFloat(foodCarbs) || 0);
    formData.append('protein', parseFloat(foodProtein) || 0);
    formData.append('fats', parseFloat(foodFats) || 0);
    
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
        setFoodCarbs('');
        setFoodProtein('');
        setFoodFats('');
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
    if (predictedFood.nutritional_values) {
      // For raw foods
      setFoodName(predictedFood.name);
      setFoodCalories(predictedFood.nutritional_values.calories);
      setFoodCarbs(predictedFood.nutritional_values.carbs);
      setFoodProtein(predictedFood.nutritional_values.protein);
      setFoodFats(predictedFood.nutritional_values.fats);
    } else if (predictedFood.ingredients) {
      // For prepared foods
      setFoodName(predictedFood.name);
      // Calculate total nutritional values from ingredients
      const totalAmount = predictedFood.ingredients.reduce((sum, ing) => sum + ing.amount, 0);
      const totalCalories = predictedFood.ingredients.reduce((sum, ing) => sum + (ing.calories * ing.amount), 0);
      const totalCarbs = predictedFood.ingredients.reduce((sum, ing) => sum + (ing.carbs * ing.amount), 0);
      const totalProtein = predictedFood.ingredients.reduce((sum, ing) => sum + (ing.protein * ing.amount), 0);
      const totalFats = predictedFood.ingredients.reduce((sum, ing) => sum + (ing.fats * ing.amount), 0);
      
      setFoodCalories(totalCalories / totalAmount);
      setFoodCarbs(totalCarbs / totalAmount);
      setFoodProtein(totalProtein / totalAmount);
      setFoodFats(totalFats / totalAmount);
    }
    setShowForm(true);
  };

  const handleIncorrectPrediction = () => {
    setPredictedFood(null);  // Clear the prediction
    setShowForm(false);  // Hide the form
    alert("Please take a new picture of your food.");
  };

  const handleManualSubmit = () => {
    setShowSimpleForm(true);
    setShowForm(false);
    setShowRecipesForm(false); // Hide recipes form
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
      setIsLoading(true);

      const formData = new FormData();
      formData.append('food_name', foodName.trim());

      const response = await fetch(`${BASE_URL}/process-food-text2`, {
        method: 'POST',
        body: formData,
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Accept-Language': i18n.language
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        if (result.ingredients && Array.isArray(result.ingredients) && result.ingredients.length > 1) {
          // Process multiple ingredients - calculate per gram values
          const processedIngredients = result.ingredients.map(ingredient => {
            const amount = parseFloat(ingredient.amount) || 1;
            return {
              ...ingredient,
              calories: (parseFloat(ingredient.calories) / amount) || 0,
              carbs: (parseFloat(ingredient.carbs) / amount) || 0,
              protein: (parseFloat(ingredient.protein) / amount) || 0,
              fat: (parseFloat(ingredient.fat) / amount) || 0
            };
          });

          setFoodName(result.food_name);
          setIngredientsForm(processedIngredients);
          setShowIngredientsForm(true);
          setShowSimpleForm(false);
          setShowForm(false);
          setCalculatedCalories(calculateCalories(processedIngredients));
          setCalculatedCarbs(calculateCarbs(processedIngredients));
          setCalculatedProtein(calculateProtein(processedIngredients));
          setCalculatedFat(calculateFat(processedIngredients));
        } else if (result.ingredients && result.ingredients.length === 1) {
          // Process single ingredient - calculate per gram values
          const ingredient = result.ingredients[0];
          const amount = parseFloat(ingredient.amount) || 1;

          setFoodName(result.food_name);
          setFoodCalories((parseFloat(ingredient.calories) / amount) || 0);
          setFoodCarbs((parseFloat(ingredient.carbs) / amount) || 0);
          setFoodProtein((parseFloat(ingredient.protein) / amount) || 0);
          setFoodFats((parseFloat(ingredient.fat) / amount) || 0);
          setShowForm(true);
          setShowSimpleForm(false);
          setShowIngredientsForm(false);
        }
      } else {
        if (result.message === "Insert raw food or add raw food only") {
          showCustomAlert(t('insert_raw_food_message'));
        } else {
          showCustomAlert(t('food_detection_failed'));
        }
      }
    } catch (error) {
      console.error('Error processing food text:', error);
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
    // Optionally auto-hide after a few seconds
    setTimeout(() => {
      setShowAlert(false);
    }, 3000);
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

  // Log the form data being sent
  console.log("Form data being sent:");
  console.log("User ID:", userId);
  console.log("Food Name:", foodName);
  console.log("Calories:", foodCalories);

  try {
    const response = await fetch(`${BASE_URL}/api/save-user-food`, {
      method: 'POST',
      body: formData,
      headers: {
        'ngrok-skip-browser-warning': 'true'
      }
    });

    // Log the response status
    console.log("Response status:", response.status);

    const data = await response.json();

    // Log the response data
    console.log("Response data:", data);

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
    } else {
      console.error('Error saving food:', data.message);
      showCustomAlert('Error saving food: ' + (data.message || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error:', error);
    showCustomAlert('Error saving food');
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
    setShowSimpleForm(false); // Hide manual input form
    setPredictedFood(null);
    setFoodName('');
    stopCamera();
  };

  const handleRecipesFormSubmit = (event) => {
    event.preventDefault();
    
    if (foodName && foodCalories !== undefined && foodCarbs !== undefined && 
        foodProtein !== undefined && foodFats !== undefined) {
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

  // Add these new calculation functions
  const calculateCarbs = (ingredients) => {
    const totalCarbs = ingredients.reduce((total, ingredient) => {
      const carbs = parseFloat(ingredient.carbs) || 0;
      const amount = parseFloat(ingredient.amount) || 0;
      return total + (carbs * amount);
    }, 0);

    const totalAmount = ingredients.reduce((total, ingredient) => {
      return total + (parseFloat(ingredient.amount) || 0);
    }, 0);

    return totalAmount > 0 ? totalCarbs / totalAmount : 0;
  };

  const calculateProtein = (ingredients) => {
    const totalProtein = ingredients.reduce((total, ingredient) => {
      const protein = parseFloat(ingredient.protein) || 0;
      const amount = parseFloat(ingredient.amount) || 0;
      return total + (protein * amount);
    }, 0);

    const totalAmount = ingredients.reduce((total, ingredient) => {
      return total + (parseFloat(ingredient.amount) || 0);
    }, 0);

    return totalAmount > 0 ? totalProtein / totalAmount : 0;
  };

  const calculateFat = (ingredients) => {
    const totalFat = ingredients.reduce((total, ingredient) => {
      const fat = parseFloat(ingredient.fat) || 0;
      const amount = parseFloat(ingredient.amount) || 0;
      return total + (fat * amount);
    }, 0);

    const totalAmount = ingredients.reduce((total, ingredient) => {
      return total + (parseFloat(ingredient.amount) || 0);
    }, 0);

    return totalAmount > 0 ? totalFat / totalAmount : 0;
  };

  // Function to handle adding a new ingredient row
  const addIngredientRow = () => {
    const newIngredients = [...ingredientsForm, { name: '', calories: 0, amount: 0, carbs: 0, protein: 0, fat: 0 }];
    setIngredientsForm(newIngredients);
    
    // Recalculate all values
    setCalculatedCalories(calculateCalories(newIngredients));
    setCalculatedCarbs(calculateCarbs(newIngredients));
    setCalculatedProtein(calculateProtein(newIngredients));
    setCalculatedFat(calculateFat(newIngredients));
  };

  // Function to handle removing an ingredient row
  const removeIngredientRow = (index) => {
    const newIngredients = ingredientsForm.filter((_, i) => i !== index);
    setIngredientsForm(newIngredients);
    
    // Recalculate all values
    setCalculatedCalories(calculateCalories(newIngredients));
    setCalculatedCarbs(calculateCarbs(newIngredients));
    setCalculatedProtein(calculateProtein(newIngredients));
    setCalculatedFat(calculateFat(newIngredients));
  };

  // Function to handle ingredient changes
  const handleIngredientChange = (index, field, value) => {
    const updatedIngredients = [...ingredientsForm];
    const numericValue = field === 'name' ? value : parseFloat(value) || 0;
    updatedIngredients[index][field] = numericValue;
    setIngredientsForm(updatedIngredients);
    
    // Recalculate all values
    setCalculatedCalories(calculateCalories(updatedIngredients));
    setCalculatedCarbs(calculateCarbs(updatedIngredients));
    setCalculatedProtein(calculateProtein(updatedIngredients));
    setCalculatedFat(calculateFat(updatedIngredients));
  };

  // Function to handle the submission of the ingredients form
  const handleAddIntakeFromIngredients = () => {
    setFoodName(foodName); // Assuming recipeName contains the food name
    setFoodCalories(calculatedCalories);  
    setFoodCarbs(calculatedCarbs);
    setFoodProtein(calculatedProtein);
    setFoodFats(calculatedFat);
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
          setCalculatedCarbs(calculateCarbs(data.ingredients));
          setCalculatedProtein(calculateProtein(data.ingredients));
          setCalculatedFat(calculateFat(data.ingredients));
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
  const saveFood = async ({ calories, carbs, protein, fats, name }) => {
    try {
      if (!name || calories === undefined) {
        showCustomAlert('Please enter a valid food name and ensure calories are calculated');
        return;
      }

      const formData = new FormData();
      formData.append('user_id', userId);
      formData.append('food_name', name);
      formData.append('calories', calories.toString());
      formData.append('carbs', carbs.toString());
      formData.append('protein', protein.toString());
      formData.append('fats', fats.toString());

      console.log("Form data contents:");
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }

      const response = await fetch(`${BASE_URL}/api/save-user-food`, {
        method: 'POST',
        body: formData,
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.detail || 'Error saving recipe');
      }

      const data = await response.json();
      if (data.success) {
        showCustomAlert('Recipe saved successfully');
        // Reset form and state
        setRecipeName('');
        setIngredients([{ name: '', calories: 0, amount: 0, carbs: 0, protein: 0, fat: 0 }]);
        setCalculatedCalories(0);
        setCalculatedCarbs(0);
        setCalculatedProtein(0);
        setCalculatedFat(0);
        setShowCalculationResult(false);
        setShowCalorieCalculator(false);
      } else {
        throw new Error('Error saving recipe');
      }
    } catch (error) {
      console.error('Error saving food:', error);
      showCustomAlert('Error saving recipe');
    }
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

  const getProgressColor = (percentage) => {
    if (percentage <= 30) return '#FF9800';  // Orange
    if (percentage <= 60) return '#4CAF50';  // Green
    return '#2196F3';                        // Blue
  };

  const calculateTotals = () => {
    let totalCalories = 0;
    let totalCarbs = 0;
    let totalProtein = 0;
    let totalFats = 0;

    ingredients.forEach(ingredient => {
      const calories = parseFloat(ingredient.calories) || 0;
      const carbs = parseFloat(ingredient.carbs) || 0;
      const protein = parseFloat(ingredient.protein) || 0;
      const fats = parseFloat(ingredient.fats) || 0;
      const amount = parseFloat(ingredient.amount) || 0;

      totalCalories += calories * amount;
      totalCarbs += carbs * amount;
      totalProtein += protein * amount;
      totalFats += fats * amount;
    });

    setCalculatedCalories(totalCalories);
    setCalculatedCarbs(totalCarbs);
    setCalculatedProtein(totalProtein);
    setCalculatedFat(totalFats);
  };

  // Call this function whenever ingredients change
  useEffect(() => {
    calculateTotals();
  }, [ingredients]);

  console.log("Ingredient values:", ingredients);

  // Add new function to save recipe
  const handleSaveRecipe = async () => {
    if (!recipeNameToSave.trim()) {
      showCustomAlert('Please enter a recipe name');
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/api/save-recipe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          user_id: userId,
          recipe_name: recipeNameToSave,
          calories_per_gram: calculatedCalories,
          carbs_per_gram: calculatedCarbs,
          protein_per_gram: calculatedProtein,
          fats_per_gram: calculatedFat,
          ingredients: ingredientsForm
        })
      });

      const data = await response.json();
      if (data.success) {
        showCustomAlert('Recipe saved successfully');
        setShowSaveRecipeModal(false);
        setRecipeNameToSave('');
        setShowSaveRecipeModal(false);
        setShowIngredientsForm(false);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      showCustomAlert('Error saving recipe: ' + error.message);
    }
  };

  // Add this function to fetch user recipes
  const fetchUserRecipes = async () => {
    try {
      const userId = localStorage.getItem('user_id');
      console.log('Fetching recipes for user:', userId); // Debug log

      const response = await fetch(`${BASE_URL}/api/user-recipes/${userId}`, {
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        }
      });

      console.log('Recipe fetch response:', response.status); // Debug log
      const data = await response.json();
      console.log('Fetched recipes data:', data); // Debug log

      if (data.success && Array.isArray(data.recipes)) {
        console.log('Setting recipes:', data.recipes); // Debug log
        setUserRecipes(data.recipes);
      } else {
        console.error('Invalid recipe data format:', data);
      }
    } catch (error) {
      console.error('Error fetching recipes:', error);
    }
  };

  // Add useEffect to fetch recipes when component mounts
  useEffect(() => {
    fetchUserRecipes();
  }, []); // Empty dependency array means this runs once when component mounts

  // Add this effect to monitor userRecipes state
  useEffect(() => {
    console.log('Current userRecipes state:', userRecipes);
  }, [userRecipes]);

  // Add delete recipe function
  const handleDeleteRecipe = async (recipeId) => {
    try {
      const userId = localStorage.getItem('user_id');
      console.log('Delete attempt with:', { userId, recipeId }); // Debug log
      
      if (!recipeId) {
        console.error('No recipe ID provided');
        showCustomAlert('Invalid recipe ID');
        return;
      }

      const response = await fetch(`${BASE_URL}/api/user-recipes/${userId}/${recipeId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        }
      });

      console.log('Delete response status:', response.status);
      const data = await response.json();
      console.log('Delete response data:', data);

      if (response.ok) {
        showCustomAlert('Recipe deleted successfully');
        // Refresh the recipes list
        setUserRecipes(prevRecipes => prevRecipes.filter(recipe => recipe.id !== recipeId));
      } else {
        throw new Error(data.message || 'Failed to delete recipe');
      }
    } catch (error) {
      console.error('Error deleting recipe:', error);
      showCustomAlert('Error deleting recipe');
    }
  };

  // Add this useEffect to fetch recipes when the section changes
  useEffect(() => {
    console.log('Active section changed to:', activeSection); // Add this log
    if (activeSection === 'recipes') { // Make sure this matches the menu item
      console.log('Fetching recipes...'); // Add this log
      fetchUserRecipes();
    }
  }, [activeSection]);

  const handleEditRecipe = (recipeId) => {
    const recipe = userRecipes.find(r => r.id === recipeId);
    if (recipe) {
      // Format ingredients to match the form structure
      const formattedIngredients = recipe.ingredients.map(ing => ({
        name: ing.name,
        calories: ing.calories,
        carbs: ing.carbs,
        protein: ing.protein,
        fat: ing.fats,  // Note: backend uses 'fats', frontend uses 'fat'
        amount: ing.amount
      }));

      setRecipeName(recipe.name);
      setIngredients(formattedIngredients);
      
      // Set calculated values
      const totalAmount = formattedIngredients.reduce((sum, ing) => sum + ing.amount, 0);
      const totalCalories = formattedIngredients.reduce((sum, ing) => sum + (ing.calories * ing.amount), 0);
      const totalCarbs = formattedIngredients.reduce((sum, ing) => sum + (ing.carbs * ing.amount), 0);
      const totalProtein = formattedIngredients.reduce((sum, ing) => sum + (ing.protein * ing.amount), 0);
      const totalFat = formattedIngredients.reduce((sum, ing) => sum + (ing.fat * ing.amount), 0);

      setCalculatedCalories(totalCalories);
      setCalculatedCarbs(totalCarbs);
      setCalculatedProtein(totalProtein);
      setCalculatedFat(totalFat);
      
      setShowCalorieCalculator(true);
      setEditingRecipeId(recipeId);
    }
  };

  // Find the section that handles the text processing response
  const handleProcessFoodText = async () => {
    try {
      const formData = new FormData();
      formData.append('food_name', foodName);

      const response = await fetch(`${BASE_URL}/process-food-text`, {
        method: 'POST',
        headers: {
          'Accept-Language': i18n.language,
          'ngrok-skip-browser-warning': 'true'
        },
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        setRecipeName(data.food_name);
        
        // Fix: Properly map all ingredients from the response
        if (data.ingredients && Array.isArray(data.ingredients)) {
          const formattedIngredients = data.ingredients.map(ing => ({
            name: ing.name,
            calories: ing.calories,
            carbs: ing.carbs,
            protein: ing.protein,
            fat: ing.fat,
            amount: ing.amount
          }));
          setIngredients(formattedIngredients);
        } else if (data.nutritional_values) {
          // Handle raw food case
          setIngredients([{
            name: data.food_name,
            calories: data.nutritional_values.calories,
            carbs: data.nutritional_values.carbs,
            protein: data.nutritional_values.protein,
            fat: data.nutritional_values.fat,
            amount: 100 // default amount
          }]);
        }
        
        setShowCalorieCalculator(true);
        setFoodName('');
      } else {
        throw new Error(data.message || 'Failed to process food text');
      }
    } catch (error) {
      console.error('Error processing food text:', error);
      showCustomAlert(error.message || 'Error processing food text');
    }
  };

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/user-recipes/${userId}`, {
          headers: {
            'ngrok-skip-browser-warning': 'true'
          }
        });
        const data = await response.json();
        
        if (data.success && Array.isArray(data.recipes)) {
          // Format recipes for Select component
          const formattedRecipes = data.recipes.map(recipe => ({
            value: recipe.id,
            label: recipe.recipe_name || recipe.name, // Use recipe_name or fallback to name
            data: {
              name: recipe.recipe_name || recipe.name,
              calories: recipe.calories_per_gram || recipe.calories,
              carbs: recipe.carbs_per_gram || recipe.carbs,
              protein: recipe.protein_per_gram || recipe.protein,
              fats: recipe.fats_per_gram || recipe.fats
            }
          }));
          
          console.log('Formatted recipes for Select:', formattedRecipes); // Debug log
          setRecipes(formattedRecipes);
        }
      } catch (error) {
        console.error('Error fetching recipes:', error);
      }
    };

    fetchRecipes();
  }, [userId]);

  const handleSectionChange = (section) => {
    // Close all forms first
    setShowForm(false);
    setShowSimpleForm(false);
    setShowIngredientsForm(false);
    setShowRecipesForm(false);
    setShowProfile(false);
    setShowMyRecipes(false);
    setShowIntakeTable(false);
    setShowCalorieCalculator(false); // Also close calorie calculator
    setPredictedFood(null); // Clear any predicted food
    
    // Then set the active section
    setActiveSection(section);
    
    // Open the appropriate section
    switch(section) {
      case 'profile':
        setShowProfile(true);
        break;
      case 'recipes':
        setShowMyRecipes(true);
        break;
      case 'history':
        setShowIntakeTable(true);
        break;
      case 'newInput':
        // This is the default input section, no need to open anything
        setIsAnyFormVisible(false); // Make sure buttons are visible when switching to newInput
        break;
      default:
        break;
    }
    
    // Clear any camera state
    stopCamera();
    setImageDataUrl(null);
    
    // Clear form data
    setFoodName('');
    setCount('');
    setFoodCalories('');
    setFoodCarbs('');
    setFoodProtein('');
    setFoodFats('');
  };

  // Add this function to handle ingredient name processing
  const handleIngredientNameChange = async (value, index) => {
    try {
      setIsProcessingIngredient(true);
      setErrorMessage(''); // Clear any existing error message
      
      const formData = new FormData();
      formData.append('ingredient_name', value);
      
      const response = await fetch(`${BASE_URL}/process-ingredient-name`, {
        method: 'POST',
        body: formData,
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });
      
      const data = await response.json();
      
      if (!data.success) {
        if (data.message === "notraw") {
          setErrorMessage("This is not raw food. Please enter raw food.");
          return;
        }
        setErrorMessage(data.message);
        return;
      }
      
      // Update the ingredient form with the returned values
      const updatedIngredients = [...ingredients];
      updatedIngredients[index] = {
        ...updatedIngredients[index],
        name: value,
        calories: data.data.calories,
        carbs: data.data.carbs,
        protein: data.data.protein,
        fat: data.data.fats
      };
      setIngredients(updatedIngredients);
      
    } catch (error) {
      console.error('Error processing ingredient:', error);
      setErrorMessage('Error processing ingredient');
    } finally {
      setIsProcessingIngredient(false);
    }
  };

  // Add these console.logs to help debug
  const handleIngredientNameBlur = async (value, index) => {
    console.log("Blur event triggered with value:", value);
    if (!value.trim()) return;
    
    try {
      console.log("Processing ingredient:", value);
      setIsProcessingIngredient(true);
      
      const formData = new FormData();
      formData.append('ingredient_name', value);
      
      const response = await fetch(`${BASE_URL}/process-ingredient-name`, {
        method: 'POST',
        body: formData,
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Accept-Language': i18n.language
        }
      });
      
      const data = await response.json();
      console.log("API response:", data);
      
      if (!data.success) {
        // Use showCustomAlert instead of directly setting the alert state
        showCustomAlert(t('raw_food_only'));
        
        // Clear the ingredient name
        const updatedIngredients = [...ingredientsForm];
        updatedIngredients[index].name = '';
        setIngredientsForm(updatedIngredients);
        return;
      }
      
      const updatedIngredients = [...ingredientsForm];
      updatedIngredients[index] = {
        ...updatedIngredients[index],
        name: value,
        calories: data.data.calories,
        carbs: data.data.carbs,
        protein: data.data.protein,
        fat: data.data.fat
      };
      setIngredientsForm(updatedIngredients);
      
    } catch (error) {
      console.error('Error processing ingredient:', error);
      showCustomAlert(t('error_processing_ingredient'));
    } finally {
      setIsProcessingIngredient(false);
    }
  };

  const toggleIngredients = (recipeId) => {
    setExpandedRecipes(prev => ({
      ...prev,
      [recipeId]: !prev[recipeId]
    }));
  };

  // Add this handler function
  const handleHealthScoreUpdate = (score) => {
    setHealthScore(score);
  };

  // First, let's add a debug log to see what data we have in userRecipes
  useEffect(() => {
    console.log('Current userRecipes:', userRecipes); // Debug log
  }, [userRecipes]);

  // Update the useEffect to watch for form state changes
  useEffect(() => {
    const anyFormOpen = showForm || showSimpleForm || showRecipesForm || showIngredientsForm || showCalorieCalculator;
    setIsAnyFormVisible(anyFormOpen);
  }, [showForm, showSimpleForm, showRecipesForm, showIngredientsForm, showCalorieCalculator]);

  return (
    <>
      <div className="home-container" style={{
        width: '100%',
        height: '100vh',  // Full viewport height
        position: 'fixed', // Fix the container
        left: 0,
        top: 0,
        overflowY: 'hidden' // Hide overflow
      }}>
        <div style={{ 
          width: '100%', 
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header stays the same */}
          <div className="header-banner" style={{ 
            padding: '5px',
            backgroundColor: '#000000',
            color: 'white',
            width: '100%',
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: 1000,
            height: '80px' // Fixed height for header
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              maxWidth: '100%',  // Ensure full width
              margin: '0 auto',  // Center the content
              padding: '0 5px'  // Add some padding on the sides
            }}>
              {/* Left side - Logo and language selector */}
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'flex-start',  // Align children to the left
                gap: '8px',               // Increased gap between logo and selector
                flex: '1',
                paddingLeft: '15px'       // Add left padding to move items from edge
              }}>
                <img 
                  src={logo} 
                  alt="Logo" 
                  className="logo" 
                  style={{ 
                    width: '135px', 
                    height: 'auto',
                    marginBottom: '8px'  // Increased margin below logo
                  }}
                />
                <select 
                  onChange={(e) => changeLanguage(e.target.value)}
                  value={i18n.language}
                  style={{
                    padding: '2px 5px',    // Reduced vertical padding (2px) while keeping horizontal padding (5px)
                    borderRadius: '2px',
                    backgroundColor: 'white',
                    border: 'none',
                    width: '80px',
                    marginBottom: '15px',
                    height: '20px',        // Add specific height
                    fontSize: '10px',      // Slightly smaller font size
                    lineHeight: '20px',    // Adjust line height
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

              {/* Center - Welcome message and calorie info */}
              <div style={{ 
                textAlign: 'center',
                flex: '1'  // Take up available space
              }}>
                <h2 style={{ fontSize: '16px', margin: '0' }}>Welcome, {username}</h2>
                
                {healthScore !== null && (
                  <p style={{ 
                    fontSize: '14px', 
                    margin: '5px 0',
                    color: healthScore >= 7 ? '#34C759' : healthScore >= 5 ? '#FFD700' : '#FF3B30'
                  }}>
                    {t('Monthly Health Score')}: {healthScore}/10
                  </p>
                )}
              </div>

              
            </div>
          </div>

          {/* Main content area with scrolling */}
          <div style={{
            marginTop: '80px', // Match header height
            flex: 1,
            overflowY: 'auto', // Enable scrolling
            padding: '20px',
            boxSizing: 'border-box',
            width: '100%',
            height: 'calc(100vh - 80px - 60px)', // Subtract header and bottom menu heights
            paddingBottom: '80px' // Add padding for bottom menu
          }}>
            {/* ... your existing content ... */}
            {activeSection === 'newInput' && !isAnyFormVisible && (
              <div className="input-options-grid">
                <button 
                  onClick={startCamera} 
                  className="input-option-button"
                >
                  <FontAwesomeIcon icon={faCamera} className="input-icon" />
                  <span>{t('Take Photo')}</span>
                </button>

                <button 
                  onClick={() => {
                    document.getElementById('fileInput').click();
                    setShowSimpleForm(false);
                    setShowRecipesForm(false);
                  }} 
                  className="input-option-button"
                >
                  <FontAwesomeIcon icon={faUpload} className="input-icon" />
                  <span>{t('Upload Photo')}</span>
                  <input
                    id="fileInput"
                    type="file"
                    accept="image/*"
                    onChange={handleUpload}
                    style={{ display: 'none' }}
                  />
                </button>

                <button 
                  onClick={handleManualSubmit} 
                  className="input-option-button"
                >
                  <FontAwesomeIcon icon={faKeyboard} className="input-icon" />
                  <span>{t('Manual Input')}</span>
                </button>

                <button 
                  onClick={() => {
                    setShowRecipesForm(true);
                    setShowSimpleForm(false);
                    setShowForm(false);
                    setPredictedFood(null);
                    setFoodName('');
                  }} 
                  className="input-option-button"
                >
                  <FontAwesomeIcon icon={faBook} className="input-icon" />
                  <span>{t('My Recipes')}</span>
                </button>
              </div>
            )}

            {activeSection === 'history' && (
              <IntakeTable 
                userId={userId} 
                requiredCalories={selectedDateCalories}
                onUpdateTotalCalories={handleUpdateTotalCalories}  // Use this instead of setTotalConsumedCaloriesToday
              />
            )}

            {activeSection === 'charts' && ( // Render Charts component
              <Charts 
                userId={userId} 
                requiredCalories={selectedDateCalories}
                onUpdateTotalCalories={handleUpdateTotalCalories}
              />
            )}

            {activeSection === 'calendar' && ( // Render Calender component
              <Calender 
                userId={userId} 
                requiredCalories={selectedDateCalories}
                onHealthScoreUpdate={handleHealthScoreUpdate}
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
                {userRecipes.map((recipe, index) => (
                  <div 
                    key={recipe.id || index}
                    className="recipe-card"
                    style={{
                      backgroundColor: 'white',
                      padding: '20px',
                      marginBottom: '20px',
                      borderRadius: '12px',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                      border: '1px solid #eee'
                    }}
                  >
                    <div className="recipe-header" style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '15px',
                      borderBottom: '2px solid #f0f0f0',
                      paddingBottom: '10px'
                    }}>
                      <h3 style={{ 
                        margin: 0,
                        color: '#2c3e50',
                        fontSize: '1.5rem'
                      }}>{recipe.recipe_name}</h3>
                      <div className="recipe-actions">
                        
                        <button
                          onClick={() => handleDeleteRecipe(recipe.id)}
                          style={{
                            backgroundColor: '#ff3b30',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '8px 12px',
                            color: 'white',
                            cursor: 'pointer'
                          }}
                        >
                          <FontAwesomeIcon icon={faTrash} /> {t('delete')}
                        </button>
                      </div>
                    </div>
                    
                    <div className="recipe-nutrition" style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                      gap: '15px',
                      marginBottom: '20px',
                      padding: '15px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px'
                    }}>
                      <div className="nutrition-container" style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div className="nutrition-item">
                          <span style={{ color: '#666' }}>{t('Calories')}:</span>
                          <span style={{ display: 'inline-flex', alignItems: 'baseline', whiteSpace: 'nowrap' }}>
                            <strong style={{ color: '#34C759' }}>{(recipe.calories || 0).toFixed(2)}</strong>
                            <span style={{ color: '#000' }}>{t(' /g')}</span>
                          </span>
                        </div>
                        <div className="nutrition-item">
                          <span style={{ color: '#666' }}>{t('Carbs')}:</span>
                          <span style={{ display: 'inline-flex', alignItems: 'baseline', whiteSpace: 'nowrap' }}>
                            <strong style={{ color: '#5856D6' }}>{(recipe.carbs || 0).toFixed(2)}</strong>
                            <span style={{ color: '#000' }}>{t(' /g')}</span>
                          </span>
                        </div>
                        <div className="nutrition-item">
                          <span style={{ color: '#666' }}>{t('Protein')}:</span>
                          <span style={{ display: 'inline-flex', alignItems: 'baseline', whiteSpace: 'nowrap' }}>
                            <strong style={{ color: '#FF9500' }}>{(recipe.protein || 0).toFixed(2)}</strong>
                            <span style={{ color: '#000' }}>{t(' /g')}</span>
                          </span>
                        </div>
                        <div className="nutrition-item">
                          <span style={{ color: '#666' }}>{t('Fats')}:</span>
                          <span style={{ display: 'inline-flex', alignItems: 'baseline', whiteSpace: 'nowrap' }}>
                            <strong style={{ color: '#FF2D55' }}>{(recipe.fats || 0).toFixed(2)}</strong>
                            <span style={{ color: '#000' }}>{t(' /g')}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="ingredients-section">
                      <div 
                        className="ingredients-header"
                        onClick={() => toggleIngredients(recipe.id)}
                      >
                        <h4>{t('ingredients')}</h4>
                        <FontAwesomeIcon 
                          icon={faChevronDown} 
                          className={`arrow-icon ${expandedRecipes[recipe.id] ? 'expanded' : ''}`}
                        />
                      </div>
                      
                      <div className={`ingredients-content ${expandedRecipes[recipe.id] ? 'expanded' : ''}`}>
                        <table style={{
                          width: '100%',
                          borderCollapse: 'collapse',
                          marginTop: '6px'
                        }}>
                          <thead>
                            <tr style={{
                              backgroundColor: '#f8f9fa',
                              color: '#666'
                            }}>
                              <th style={{ fontWeight: 'bold', fontSize: '9px' }}>{t('ingredient')}</th>
                              <th style={{ fontWeight: 'bold', fontSize: '9px' }}>{t('amount')} (g)</th>
                              <th style={{ fontWeight: 'bold', fontSize: '9px' }}>{t('calories')}/g</th>
                              <th style={{ fontWeight: 'bold', fontSize: '9px' }}>{t('carbs')}/g</th>
                              <th style={{ fontWeight: 'bold', fontSize: '9px' }}>{t('protein')}/g</th>
                              <th style={{ fontWeight: 'bold', fontSize: '9px' }}>{t('fats')}/g</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(recipe.ingredients || []).map((ingredient, idx) => (
                              <tr key={idx} style={{
                                borderBottom: '1px solid #eee'
                              }}>
                                <td style={tableCellStyle}>{ingredient.name}</td>
                                <td style={tableCellStyle}>{ingredient.amount}</td>
                                <td style={tableCellStyle}>{(ingredient.calories || 0).toFixed(2)}</td>
                                <td style={tableCellStyle}>{(ingredient.carbs || 0).toFixed(2)}</td>
                                <td style={tableCellStyle}>{(ingredient.protein || 0).toFixed(2)}</td>
                                <td style={tableCellStyle}>{(ingredient.fats || 0).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
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
                
                {/* Display all nutritional values */}
                {predictedFood.nutritional_values ? (
                  // For raw foods
                  <>
                    <p><strong>{t('calories')}:</strong> {predictedFood.nutritional_values.calories} kcal/g</p>
                    <p><strong>{t('carbs')}:</strong> {predictedFood.nutritional_values.carbs}g</p>
                    <p><strong>{t('protein')}:</strong> {predictedFood.nutritional_values.protein}g</p>
                    <p><strong>{t('fats')}:</strong> {predictedFood.nutritional_values.fats}g</p>
                  </>
                ) : predictedFood.ingredients ? (
                  // For prepared foods with ingredients
                  <>
                    <p><strong>{t('ingredients')}:</strong></p>
                    <ul>
                      {predictedFood.ingredients.map((ingredient, index) => (
                        <li key={index}>
                          {ingredient.name}: {ingredient.amount}g
                          <ul>
                            <li>{t('calories')}: {ingredient.calories} kcal/g</li>
                            <li>{t('carbs')}: {ingredient.carbs}g</li>
                            <li>{t('protein')}: {ingredient.protein}g</li>
                            <li>{t('fats')}: {ingredient.fats}g</li>
                          </ul>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p><strong>{t('calories')}:</strong> {predictedFood.calories} kcal</p>
                )}
                
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
                  {/* Food name at top with emphasis */}
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '16px',
                      color: '#333',
                      marginBottom: '8px',
                      fontWeight: 'bold'
                    }}>
                      {t('food_name')} *
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
                        border: '2px solid #34C759',
                        borderRadius: '8px',
                        backgroundColor: '#f5f5f5'
                      }}
                      required
                    />
                  </div>

                  {/* Nutritional values display similar to image */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    marginBottom: '15px',
                    padding: '10px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', color: '#666' }}>{t('Cal/g')}:</div>
                      <div style={{ color: '#34C759', fontWeight: 'bold' }}>{Number(foodCalories).toFixed(2)}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', color: '#666' }}>{t('Carbs/g')}:</div>
                      <div style={{ color: '#5856D6', fontWeight: 'bold' }}>{Number(foodCarbs).toFixed(2)}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', color: '#666' }}>{t('Protein/g')}:</div>
                      <div style={{ color: '#FF9500', fontWeight: 'bold' }}>{Number(foodProtein).toFixed(2)}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', color: '#666' }}>{t('Fats/g')}:</div>
                      <div style={{ color: '#FF2D55', fontWeight: 'bold' }}>{Number(foodFats).toFixed(2)}</div>
                    </div>
                  </div>

                  {/* Amount input with emphasis */}
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '16px',
                      color: '#333',
                      marginBottom: '8px',
                      fontWeight: 'bold'
                    }}>
                      {t('amount_consumed')} (g) *
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
                        border: '2px solid #34C759',
                        borderRadius: '8px',
                        backgroundColor: '#f5f5f5'
                      }}
                    />
                  </div>

                  {/* Collapsible section for editing nutritional values */}
                  <div style={{ marginBottom: '15px' }}>
                    <details>
                      <summary style={{ 
                        cursor: 'pointer',
                        color: '#666',
                        fontSize: '14px',
                        marginBottom: '10px'
                      }}>
                        {t('Edit nutritional values')}
                      </summary>
                      
                      <div style={{ marginBottom: '10px' }}>
                        <label style={{ fontSize: '12px', color: '#666' }}>{t('Cal/g')}</label>
                        <input
                          type="number"
                          step="0.01"
                          value={Number(foodCalories).toFixed(2)}
                          onChange={(e) => setFoodCalories(Number(e.target.value).toFixed(2))}
                          required
                          style={{
                            width: '100%',
                            padding: '8px',
                            fontSize: '14px',
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            backgroundColor: '#f5f5f5'
                          }}
                        />
                      </div>

                      <div style={{ marginBottom: '10px' }}>
                        <label style={{ fontSize: '12px', color: '#666' }}>{t('Carbs/g')}</label>
                        <input
                          type="number"
                          step="0.01"
                          value={Number(foodCarbs).toFixed(2)}
                          onChange={(e) => setFoodCarbs(Number(e.target.value).toFixed(2))}
                          required
                          style={{
                            width: '100%',
                            padding: '8px',
                            fontSize: '14px',
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            backgroundColor: '#f5f5f5'
                          }}
                        />
                      </div>

                      <div style={{ marginBottom: '10px' }}>
                        <label style={{ fontSize: '12px', color: '#666' }}>{t('Protein/g')}</label>
                        <input
                          type="number"
                          step="0.01"
                          value={Number(foodProtein).toFixed(2)}
                          onChange={(e) => setFoodProtein(Number(e.target.value).toFixed(2))}
                          required
                          style={{
                            width: '100%',
                            padding: '8px',
                            fontSize: '14px',
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            backgroundColor: '#f5f5f5'
                          }}
                        />
                      </div>

                      <div style={{ marginBottom: '10px' }}>
                        <label style={{ fontSize: '12px', color: '#666' }}>{t('Fats/g')}</label>
                        <input
                          type="number"
                          step="0.01"
                          value={Number(foodFats).toFixed(2)}
                          onChange={(e) => setFoodFats(Number(e.target.value).toFixed(2))}
                          required
                          style={{
                            width: '100%',
                            padding: '8px',
                            fontSize: '14px',
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            backgroundColor: '#f5f5f5'
                          }}
                        />
                      </div>
                    </details>
                  </div>

                  {/* Date field */}
                  <div style={{ marginBottom: '15px' }}>
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
                        fontSize: '14px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        backgroundColor: '#f5f5f5'
                      }}
                    />
                  </div>

                  {/* Action buttons */}
                  <div style={{
                    display: 'flex',
                    gap: '10px',
                    marginTop: '20px'
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
                  <h3>{t('Add new receipe')}</h3>
                  
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
                                  newIngredients[index].carbs = selectedFood.carbs;
                                  newIngredients[index].protein = selectedFood.protein;
                                  newIngredients[index].fats = selectedFood.fats;
                                }
                                setIngredients(newIngredients);
                              }}
                              onBlur={(e) => handleIngredientNameBlur(e.target.value, index)}
                              placeholder={t('Ingredient name')}
                              disabled={isProcessingIngredient}
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
                            <label>{t('carbs_label')}</label>
                            <input
                              type="number"
                              value={ingredient.carbs}
                              onChange={(e) => {
                                const newIngredients = [...ingredients];
                                newIngredients[index].carbs = parseFloat(e.target.value) || 0;
                                setIngredients(newIngredients);
                              }}
                              min="0"
                              step="0.1"
                            />
                          </div>

                          <div className="form-group">
                            <label>{t('protein_label')}</label>
                            <input
                              type="number"
                              value={ingredient.protein}
                              onChange={(e) => {
                                const newIngredients = [...ingredients];
                                newIngredients[index].protein = parseFloat(e.target.value) || 0;
                                setIngredients(newIngredients);
                              }}
                              min="0"
                              step="0.1"
                            />
                          </div>

                          <div className="form-group">
                            <label>{t('fats_label')}</label>
                            <input
                              type="number"
                              value={ingredient.fats}
                              onChange={(e) => {
                                const newIngredients = [...ingredients];
                                newIngredients[index].fats = parseFloat(e.target.value) || 0;
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
                        {t('Add new ingredient')}
                      </button>

                      <div className="save-recipe-section">
                        <div className="form-group">
                          <label>{t('Food name label')}</label>
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
                            const totalCalories = ingredients.reduce((sum, ing) => 
                              sum + (ing.calories * ing.amount), 0);
                            const totalCarbs = ingredients.reduce((sum, ing) => 
                              sum + (ing.carbs * ing.amount), 0);
                            const totalProtein = ingredients.reduce((sum, ing) => 
                              sum + (ing.protein * ing.amount), 0);
                            const totalFat = ingredients.reduce((sum, ing) => 
                              sum + (ing.fats * ing.amount), 0);

                            if (totalAmount === 0) {
                              showCustomAlert(t('Please add ingredients'));
                              return;
                            }

                            // Calculate per gram values
                            const calculatedCaloriesPerGram = totalCalories / totalAmount;
                            const calculatedCarbsPerGram = totalCarbs / totalAmount;
                            const calculatedProteinPerGram = totalProtein / totalAmount;
                            const calculatedFatPerGram = totalFat / totalAmount;

                            setCalculatedCalories(calculatedCaloriesPerGram);
                            setCalculatedCarbs(calculatedCarbsPerGram);
                            setCalculatedProtein(calculatedProteinPerGram);
                            setCalculatedFat(calculatedFatPerGram);
                            
                            console.log("Recipe Name:", recipeName);
                            console.log("Calculated Calories per Gram:", calculatedCaloriesPerGram);
                            console.log("Calculated Carbs per Gram:", calculatedCarbsPerGram);
                            console.log("Calculated Protein per Gram:", calculatedProteinPerGram);
                            console.log("Calculated Fat per Gram:", calculatedFatPerGram);

                            setShowCalculationResult(true);

                            // If editing, update the recipe
                            if (editingRecipeId) {
                              saveFood({
                                id: editingRecipeId,
                                calories: calculatedCaloriesPerGram,
                                carbs: calculatedCarbsPerGram,
                                protein: calculatedProteinPerGram,
                                fats: calculatedFatPerGram,
                                name: recipeName,
                                ingredients: ingredients
                              }, true);  // true indicates this is an edit
                            } else {
                              // Save as new recipe
                              saveFood({
                                calories: calculatedCaloriesPerGram,
                                carbs: calculatedCarbsPerGram,
                                protein: calculatedProteinPerGram,
                                fats: calculatedFatPerGram,
                                name: recipeName,
                                ingredients: ingredients
                              });
                            }
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
                            setEditingRecipeId(null);
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
                        <p><strong>{t('carbs_per_gram')}</strong> {calculatedCarbs.toFixed(2)}</p>
                        <p><strong>{t('protein_per_gram')}</strong> {calculatedProtein.toFixed(2)}</p>
                        <p><strong>{t('fats_per_gram')}</strong> {calculatedFat.toFixed(2)}</p>
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
                            saveFood({
                              calories: calculatedCalories,
                              carbs: calculatedCarbs,
                              protein: calculatedProtein,
                              fats: calculatedFat,
                              name: recipeName
                            });
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
                            setEditingRecipeId(null);
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
                    
                    <Select
                      placeholder={t('select_food')}
                      options={recipes}
                      onChange={(selectedOption) => {
                        if (selectedOption) {
                          const recipe = selectedOption.data;
                          setFoodName(recipe.name);
                          setFoodCalories(recipe.calories);
                          setFoodCarbs(recipe.carbs);
                          setFoodProtein(recipe.protein);
                          setFoodFats(recipe.fats);
                        }
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
              <div className="ingredients-form" style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '20px',
                margin: '20px auto', // Center the form
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                width: '90%', // Reduce width
                maxWidth: '320px'
              }}>
                {/* Food name at top with emphasis */}
                <div style={{ marginBottom: '15px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '16px',
                    color: '#333',
                    marginBottom: '8px',
                    fontWeight: 'bold'
                  }}>
                    {t('food_name')} *
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
                      border: '2px solid #34C759',
                      borderRadius: '8px',
                      backgroundColor: '#f5f5f5'
                    }}
                    required
                  />
                </div>

                {/* Nutritional values display */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  marginBottom: '15px',
                  padding: '10px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#666' }}>{t('Cal/g')}:</div>
                    <div style={{ color: '#34C759', fontWeight: 'bold' }}>{calculatedCalories.toFixed(2)}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#666' }}>{t('Carbs/g')}:</div>
                    <div style={{ color: '#5856D6', fontWeight: 'bold' }}>{calculatedCarbs.toFixed(2)}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#666' }}>{t('Protein/g')}:</div>
                    <div style={{ color: '#FF9500', fontWeight: 'bold' }}>{calculatedProtein.toFixed(2)}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#666' }}>{t('Fats/g')}:</div>
                    <div style={{ color: '#FF2D55', fontWeight: 'bold' }}>{calculatedFat.toFixed(2)}</div>
                  </div>
                </div>

                {/* Ingredients section */}
                <div style={{ marginBottom: '15px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '16px',
                    color: '#333',
                    marginBottom: '12px',
                    fontWeight: 'bold'
                  }}>
                    {t('Ingredients')}
                  </label>
                  
                  {ingredientsForm.map((ingredient, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      gap: '8px', // Reduce gap
                      marginBottom: '10px',
                      alignItems: 'center',
                      width: '100%'
                    }}>
                      <input
                        type="text"
                        value={ingredient.name}
                        onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                        onBlur={(e) => handleIngredientNameBlur(e.target.value, index)}
                        placeholder={t('Ingredient name')}
                        style={{
                          flex: '3', // Adjust flex ratio
                          padding: '8px',
                          fontSize: '14px',
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          backgroundColor: '#f5f5f5',
                          minWidth: '0' // Prevent input from overflowing
                        }}
                      />
                      <input
                        type="number"
                        value={ingredient.amount}
                        onChange={(e) => handleIngredientChange(index, 'amount', e.target.value)}
                        placeholder="0g"
                        style={{
                          flex: '2', // Adjust flex ratio
                          padding: '8px',
                          fontSize: '14px',
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          backgroundColor: '#f5f5f5',
                          minWidth: '0' // Prevent input from overflowing
                        }}
                      />
                      <button 
                        onClick={() => removeIngredientRow(index)}
                        style={{
                          padding: '8px',
                          backgroundColor: 'transparent',
                          border: 'none',
                          color: '#ff3b30',
                          cursor: 'pointer',
                          flexShrink: '0', // Prevent button from shrinking
                          width: '32px', // Fixed width for delete button
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  ))}

                  <button 
                    onClick={addIngredientRow}
                    style={{
                      width: '100%',
                      padding: '10px',
                      marginTop: '10px',
                      backgroundColor: '#f8f9fa',
                      border: '1px dashed #ddd',
                      borderRadius: '8px',
                      color: '#666',
                      cursor: 'pointer'
                    }}
                  >
                    <FontAwesomeIcon icon={faPlus} style={{ marginRight: '8px' }} />
                    {t('Add ingredient')}
                  </button>
                </div>

                {/* Action buttons */}
                <div style={{
                  display: 'flex',
                  gap: '10px',
                  marginTop: '20px'
                }}>
                  <button 
                    onClick={() => setShowSaveRecipeModal(true)}
                    style={{
                      flex: '1',
                      padding: '14px',
                      backgroundColor: '#f8f9fa',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      color: '#666',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    <FontAwesomeIcon icon={faStar} style={{ marginRight: '8px' }} />
                    {t('Save recipe')}
                  </button>
                  <button 
                    onClick={handleAddIntakeFromIngredients}
                    style={{
                      flex: '1',
                      padding: '14px',
                      backgroundColor: '#34C759',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    {t('Confirm')}
                  </button>
                  <button 
                    onClick={() => setShowIngredientsForm(false)}
                    style={{
                      flex: '1',
                      padding: '14px',
                      backgroundColor: '#ff3b30',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    {t('cancel')}
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'recipes' && (
              <div className="recipes-section">
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '20px',
                  marginBottom: '20px'
                }}>
                  <h2>{t('my_recipes')}</h2>
                  <button 
                    onClick={() => {
                      setShowIngredientsForm(true);
                    }}
                    style={{
                      backgroundColor: '#34C759',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 20px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <FontAwesomeIcon icon={faPlus} />
                    {t('Add Recipe')}
                  </button>
                </div>

                {/* Existing recipes list */}
                {userRecipes.map((recipe, index) => (
                  <div 
                    key={recipe.id || index}
                    className="recipe-card"
                    style={{
                      backgroundColor: 'white',
                      padding: '20px',
                      marginBottom: '20px',
                      borderRadius: '12px',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                      border: '1px solid #eee'
                    }}
                  >
                    <div className="recipe-header" style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '15px',
                      borderBottom: '2px solid #f0f0f0',
                      paddingBottom: '10px'
                    }}>
                      <h3 style={{ 
                        margin: 0,
                        color: '#2c3e50',
                        fontSize: '1.5rem'
                      }}>{recipe.recipe_name}</h3>
                      <div className="recipe-actions">
                        
                        <button
                          onClick={() => handleDeleteRecipe(recipe.id)}
                          style={{
                            backgroundColor: '#ff3b30',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '8px 12px',
                            color: 'white',
                            cursor: 'pointer'
                          }}
                        >
                          <FontAwesomeIcon icon={faTrash} /> {t('delete')}
                        </button>
                      </div>
                    </div>
                    
                    <div className="recipe-nutrition" style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                      gap: '15px',
                      marginBottom: '20px',
                      padding: '15px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px'
                    }}>
                      <div className="nutrition-container" style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div className="nutrition-item">
                          <span style={{ color: '#666' }}>{t('Calories')}:</span>
                          <span style={{ display: 'inline-flex', alignItems: 'baseline', whiteSpace: 'nowrap' }}>
                            <strong style={{ color: '#34C759' }}>{(recipe.calories || 0).toFixed(2)}</strong>
                            <span style={{ color: '#000' }}>{t(' /g')}</span>
                          </span>
                        </div>
                        <div className="nutrition-item">
                          <span style={{ color: '#666' }}>{t('Carbs')}:</span>
                          <span style={{ display: 'inline-flex', alignItems: 'baseline', whiteSpace: 'nowrap' }}>
                            <strong style={{ color: '#5856D6' }}>{(recipe.carbs || 0).toFixed(2)}</strong>
                            <span style={{ color: '#000' }}>{t(' /g')}</span>
                          </span>
                        </div>
                        <div className="nutrition-item">
                          <span style={{ color: '#666' }}>{t('Protein')}:</span>
                          <span style={{ display: 'inline-flex', alignItems: 'baseline', whiteSpace: 'nowrap' }}>
                            <strong style={{ color: '#FF9500' }}>{(recipe.protein || 0).toFixed(2)}</strong>
                            <span style={{ color: '#000' }}>{t(' /g')}</span>
                          </span>
                        </div>
                        <div className="nutrition-item">
                          <span style={{ color: '#666' }}>{t('Fats')}:</span>
                          <span style={{ display: 'inline-flex', alignItems: 'baseline', whiteSpace: 'nowrap' }}>
                            <strong style={{ color: '#FF2D55' }}>{(recipe.fats || 0).toFixed(2)}</strong>
                            <span style={{ color: '#000' }}>{t(' /g')}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="ingredients-section">
                      <div 
                        className="ingredients-header"
                        onClick={() => toggleIngredients(recipe.id)}
                      >
                        <h4>{t('ingredients')}</h4>
                        <FontAwesomeIcon 
                          icon={faChevronDown} 
                          className={`arrow-icon ${expandedRecipes[recipe.id] ? 'expanded' : ''}`}
                        />
                      </div>
                      
                      <div className={`ingredients-content ${expandedRecipes[recipe.id] ? 'expanded' : ''}`}>
                        <table style={{
                          width: '100%',
                          borderCollapse: 'collapse',
                          marginTop: '6px'
                        }}>
                          <thead>
                            <tr style={{
                              backgroundColor: '#f8f9fa',
                              color: '#666'
                            }}>
                              <th style={{ fontWeight: 'bold', fontSize: '9px' }}>{t('ingredient')}</th>
                              <th style={{ fontWeight: 'bold', fontSize: '9px' }}>{t('amount')} (g)</th>
                              <th style={{ fontWeight: 'bold', fontSize: '9px' }}>{t('calories')}/g</th>
                              <th style={{ fontWeight: 'bold', fontSize: '9px' }}>{t('carbs')}/g</th>
                              <th style={{ fontWeight: 'bold', fontSize: '9px' }}>{t('protein')}/g</th>
                              <th style={{ fontWeight: 'bold', fontSize: '9px' }}>{t('fats')}/g</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(recipe.ingredients || []).map((ingredient, idx) => (
                              <tr key={idx} style={{
                                borderBottom: '1px solid #eee'
                              }}>
                                <td style={tableCellStyle}>{ingredient.name}</td>
                                <td style={tableCellStyle}>{ingredient.amount}</td>
                                <td style={tableCellStyle}>{(ingredient.calories || 0).toFixed(2)}</td>
                                <td style={tableCellStyle}>{(ingredient.carbs || 0).toFixed(2)}</td>
                                <td style={tableCellStyle}>{(ingredient.protein || 0).toFixed(2)}</td>
                                <td style={tableCellStyle}>{(ingredient.fats || 0).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Add this div just before the closing div.home-container */}
        <div style={{ height: '100px' }}></div> {/* Spacer div */}
      </div>
      
      {/* Bottom menu */}
      <div className="menu-list" style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'space-around',
        backgroundColor: 'white',
        padding: '10px 0',
        borderTop: '1px solid #eee',
        width: '100%',
        boxSizing: 'border-box',
        height: '60px', // Fixed height for bottom menu
        zIndex: 1000
      }}>
        <li 
          onClick={() => handleSectionChange('newInput')} 
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
          <span style={{ fontSize: '10px' }}>{t('New input')}</span>
        </li>
        <li 
          onClick={() => handleSectionChange('history')} 
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
          <span style={{ fontSize: '10px' }}>{t('Intake Table')}</span>
        </li>
        <li 
          onClick={() => handleSectionChange('calendar')} 
          className={`menu-item ${activeSection === 'calendar' ? 'active' : ''}`}
          style={{ 
            listStyle: 'none',
            color: activeSection === 'calendar' ? '#34C759' : '#8E8E93',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <FontAwesomeIcon icon={faCalendarAlt} />
          <span style={{ fontSize: '10px' }}>{t('Calendar')}</span>
        </li>
        <li 
          onClick={() => handleSectionChange('charts')} 
          className={`menu-item ${activeSection === 'charts' ? 'active' : ''}`}
          style={{ 
            listStyle: 'none',
            color: activeSection === 'charts' ? '#34C759' : '#8E8E93',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <FontAwesomeIcon icon={faChartBar} />
          <span style={{ fontSize: '10px' }}>{t('Charts')}</span>
        </li>
        <li 
          onClick={() => handleSectionChange('recipes')} 
          className={`menu-item ${activeSection === 'recipes' ? 'active' : ''}`}
          style={{ 
            listStyle: 'none',
            color: activeSection === 'recipes' ? '#34C759' : '#8E8E93',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <FontAwesomeIcon icon={faBook} />
          <span style={{ fontSize: '10px' }}>{t('My Recipes')}</span>
        </li>
        <li 
          onClick={() => handleSectionChange('profile')} 
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
          <span style={{ fontSize: '10px' }}>{t('Profile')}</span>
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
      
      {showAlert && (
        <CustomAlert 
          message={alertMessage}
          onClose={() => setShowAlert(false)}
        />
      )}
      {showSaveRecipeModal && (
        <>
          <div className="modal-overlay" onClick={() => setShowSaveRecipeModal(false)} />
          <div className="save-recipe-modal">
            <h3>{t('Enter Recipe Name')}</h3>
            <input
              type="text"
              value={recipeNameToSave}
              onChange={(e) => setRecipeNameToSave(e.target.value)}
              placeholder={t('Recipe name')}
            />
            <div className="button-group">
              <button 
                className="primary-button"
                onClick={handleSaveRecipe}
              >
                {t('Save')}
              </button>
              <button 
                className="cancel-btn"
                onClick={() => setShowSaveRecipeModal(false)}
              >
                {t('Cancel')}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Home;


