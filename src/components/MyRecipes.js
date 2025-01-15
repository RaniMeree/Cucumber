import React, { useState, useEffect } from 'react';
import '../App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faEdit, faTimes, faPlus } from '@fortawesome/free-solid-svg-icons';
import CustomAlert from './CustomAlert';

const BASE_URL = process.env.REACT_APP_BASE_URL;
if (!BASE_URL) {
  console.error('REACT_APP_BASE_URL is not defined in environment variables');
}

const MyRecipes = () => {
  const [userRecipes, setUserRecipes] = useState([]);
  const [showRecipes, setShowRecipes] = useState(false);

  const fetchUserRecipes = async () => {
    const userId = localStorage.getItem('user_id');
    try {
      const response = await fetch(`${BASE_URL}/api/user-recipes/${userId}`);
      const data = await response.json();
      if (data.success) {
        setUserRecipes(data.recipes);
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error('Error fetching recipes:', error);
    }
  };

  const handleDeleteRecipe = async (recipeId) => {
    const userId = localStorage.getItem('user_id');
    try {
      const response = await fetch(`${BASE_URL}/api/user-recipes/${userId}/${recipeId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        showCustomAlert('Recipe deleted successfully');
        fetchUserRecipes(); // Refresh the list
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error('Error deleting recipe:', error);
    }
  };

  useEffect(() => {
    if (showRecipes) {
      fetchUserRecipes();
    }
  }, [showRecipes]);

  return (
    <>
      {/* ... existing code ... */}

      {showRecipes && (
        <div>
          {userRecipes.map((recipe) => (
            <div key={recipe.id}>
              <h3>{recipe.name}</h3>
              <p>Calories: {recipe.calories}</p>
              <p>Carbs: {recipe.carbs}</p>
              <p>Protein: {recipe.protein}</p>
              <p>Fats: {recipe.fats}</p>
              <ul>
                {recipe.ingredients.map((ing, index) => (
                  <li key={index}>
                    {ing.name}: {ing.amount}g
                  </li>
                ))}
              </ul>
              <button onClick={() => handleDeleteRecipe(recipe.id)}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default MyRecipes; 