import React, { useState, useEffect } from 'react';
import '../App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faEdit, faTimes, faPlus } from '@fortawesome/free-solid-svg-icons';
import CustomAlert from './CustomAlert';

const BASE_URL = process.env.REACT_APP_BASE_URL;
if (!BASE_URL) {
  console.error('REACT_APP_BASE_URL is not defined in environment variables');
}

const MyRecipes = ({ onClose, foodsAndCalories }) => {
  const [recipes, setRecipes] = useState([]);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [showCalorieCalculator, setShowCalorieCalculator] = useState(false);
  const [ingredients, setIngredients] = useState([{ name: '', calories: 0, amount: 0 }]);
  const [recipeName, setRecipeName] = useState('');
  const [showCalculationResult, setShowCalculationResult] = useState(false);
  const [calculatedCalories, setCalculatedCalories] = useState(0);
  const [caloriesPerGram, setCaloriesPerGram] = useState('');

  const userId = localStorage.getItem('user_id');

  const showCustomAlert = (message, autoClose = true) => {
    setAlertMessage(message);
    setShowAlert(true);
    
    if (autoClose) {
      // Automatically close the alert after 2 seconds
      setTimeout(() => {
        setShowAlert(false);
      }, 2000);
    }
  };

  useEffect(() => {
    console.log("Component mounted");
    console.log("User ID:", userId);
    fetchRecipes();
  }, []);

  useEffect(() => {
    console.log("MyRecipes component mounted");
  }, []);

  const fetchRecipes = async () => {
    try {
      const apiUrl = new URL(`/api/user-foods/${userId}`, BASE_URL).toString();
      const response = await fetch(apiUrl, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });
      const data = await response.json();
      console.log("Fetched recipes:", data.foods);
      setRecipes(data.foods);
    } catch (error) {
      console.error('Error fetching recipes:', error);
      showCustomAlert('Error loading recipes');
    }
  };

  const handleDeleteFood = async (foodName) => {
    try {
      const deleteUrl = new URL(`/api/user-foods/${userId}/${foodName}`, BASE_URL).toString();
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });

      if (response.ok) {
        showCustomAlert('Food deleted successfully');
        fetchRecipes(); // Refresh the list after deletion
      } else {
        showCustomAlert('Error deleting food');
      }
    } catch (error) {
      console.error('Error deleting food:', error);
      showCustomAlert('Error deleting food');
    }
  };

  const handleEdit = (recipe) => {
    setEditingRecipe({ ...recipe });
  };

  const handleUpdate = async () => {
    try {
      const formData = new FormData();
      formData.append('user_id', userId);
      formData.append('food_name', editingRecipe.name);
      formData.append('calories', editingRecipe.calories);

      const updateUrl = new URL(`/api/update-user-food/${userId}/${editingRecipe.name}`, BASE_URL).toString();
      const response = await fetch(updateUrl, {
        method: 'PUT',
        body: formData,
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });

      if (response.ok) {
        showCustomAlert('Recipe updated successfully');
        setEditingRecipe(null);
        fetchRecipes();
      } else {
        showCustomAlert('Error updating recipe');
      }
    } catch (error) {
      console.error('Error:', error);
      showCustomAlert('Error updating recipe');
    }
  };

  const handleSaveFood = () => {
    if (!recipeName || !calculatedCalories) {
      setAlertMessage('Please enter both food name and calculate the calories.');
      setShowAlert(true);
      return;
    }

    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('food_name', recipeName);
    formData.append('calories', calculatedCalories);

    const saveUrl = new URL('/api/save-user-food', BASE_URL).toString();
    fetch(saveUrl, {
      method: 'POST',
      body: formData,
      headers: {
        'ngrok-skip-browser-warning': 'true'
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        setAlertMessage('Food saved successfully!');
        setShowAlert(true);
        setRecipeName('');
        setCalculatedCalories(0);
        setShowCalorieCalculator(false);
        fetchRecipes();
      } else {
        setAlertMessage('Error saving food.');
        setShowAlert(true);
      }
    })
    .catch(error => {
      setAlertMessage('Error saving food.');
      setShowAlert(true);
      console.error('Error:', error);
    });
  };

  // Ensure the input field for recipe name updates the state
  const handleRecipeNameChange = (e) => {
    setRecipeName(e.target.value);
    console.log("Recipe Name updated:", e.target.value);
  };

  // Ensure the calculation logic updates the state
  const calculateCalories = () => {
    console.log("Calculating calories...");
    const totalIngredientWeight = ingredients.reduce((total, ingredient) => {
      return total + ingredient.amount;
    }, 0);
    
    const totalCalories = ingredients.reduce((total, ingredient) => {
      return total + (ingredient.calories * ingredient.amount);
    }, 0);

    // Calculate calories per gram
    const caloriesPerGram = totalIngredientWeight > 0 ? totalCalories / totalIngredientWeight : 0;
    setCalculatedCalories(caloriesPerGram);
    
    console.log("Recipe Name:", recipeName);
    console.log("Calculated Calories per Gram:", caloriesPerGram);
    
    setShowCalculationResult(true);
  };

  return (
    <div className="my-recipes-container">
      <div className="my-recipes-header">
        <h2>My Recipes</h2>
        <div className="header-actions">
          <button 
            onClick={() => setShowCalorieCalculator(true)} 
            className="add-recipe-btn"
          >
            <FontAwesomeIcon icon={faPlus} /> Add Food
          </button>
          <button onClick={onClose} className="close-button">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
      </div>

      <div className="recipes-list">
        {recipes.map((recipe) => (
          <div key={recipe.name} className="recipe-item">
            <div className="recipe-info">
              <span className="recipe-name">{recipe.name}</span>
              <span className="recipe-calories">{recipe.calories.toFixed(2)} cal/g</span>
            </div>
            <button 
              onClick={() => handleDeleteFood(recipe.name)}
              className="delete-btn"
              title="Delete recipe"
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        ))}
      </div>

      {showCalorieCalculator && (
        <div className="modal-overlay">
          <div className="calculator-modal">
            <h3>Add New Food</h3>
            
            {!showCalculationResult ? (
              <>
                {ingredients.map((ingredient, index) => (
                  <div key={index} className="ingredient-row" style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Ingredient:</label>
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
                      <label>Calories/g:</label>
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
                      <label>Amount (g):</label>
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
                        style={{
                          padding: '5px 10px',
                          borderRadius: '5px',
                          backgroundColor: '#dc3545',
                          color: '#fff',
                          border: 'none',
                          marginLeft: '10px'
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                
                <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '10px' }}>
                  <button 
                    type="button"
                    onClick={() => setIngredients([...ingredients, { name: '', calories: 0, amount: 0 }])}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '5px',
                      backgroundColor: '#28a745',
                      color: '#fff',
                      border: 'none'
                    }}
                  >
                    + Add New Row
                  </button>
                </div>

                <div className="save-recipe-section">
                  <div className="form-group">
                    <label>Food Name:</label>
                    <input
                      type="text"
                      value={recipeName}
                      onChange={handleRecipeNameChange}
                      placeholder="Enter food name"
                      className="recipe-name-input"
                      required
                    />
                  </div>
                </div>

                <div className="calculator-buttons">
                  <button 
                    type="button"
                    onClick={() => {
                      console.log("Calculate button clicked");
                      calculateCalories();
                    }}
                    className="calculate-btn"
                  >
                    Calculating
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
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <div className="calculation-result">
                <h4>Calculation Result</h4>
                <div className="result-details">
                  <p><strong>Food Name:</strong> {recipeName}</p>
                  <p><strong>Calories per gram:</strong> {calculatedCalories.toFixed(2)}</p>
                  <p className="ingredients-summary">
                    <strong>Ingredients:</strong>
                    <ul>
                      {ingredients.map((ing, index) => (
                        ing.name && ing.amount > 0 && (
                          <li key={index}>
                            {ing.name}: {ing.amount}g ({ing.calories} cal/g)
                          </li>
                        )
                      ))}
                    </ul>
                  </p>
                </div>
                
                <div className="calculator-buttons">
                  <button 
                    type="button"
                    onClick={handleSaveFood}
                    className="save-btn"
                  >
                    Add Food
                  </button>
                  
                  <button 
                    type="button"
                    onClick={() => {
                      setShowCalculationResult(false);
                    }}
                    className="edit-btn"
                  >
                    Edit
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
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showAlert && (
        <CustomAlert 
          message={alertMessage}
          autoClose={true}
          showButton={false}
          onClose={() => setShowAlert(false)}
        />
      )}
    </div>
  );
};

export default MyRecipes; 