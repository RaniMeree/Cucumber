from fastapi import FastAPI, HTTPException, UploadFile, File, Depends, Header, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import logging
from sqlalchemy import create_engine, Column, Integer, String, Float, text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from fastapi.responses import JSONResponse
import shutil
import os
from pydantic import BaseModel, EmailStr
from datetime import date, timedelta, datetime
import bcrypt
from passlib.context import CryptContext
from jose import JWTError, jwt
from sqlalchemy.pool import StaticPool
from PIL import Image
import warnings
import spacy  # For better NLP processing
from typing import Optional
import sys
import io
from openai import OpenAI
import base64
from starlette.background import BackgroundTask
import asyncio
import json
import pandas as pd
from fuzzywuzzy import process
import re
from email_verification import (
    generate_verification_code,
    send_verification_code,
    verification_codes,
    router as email_verification_router
)
import random
import string
from slowapi import Limiter
from slowapi.util import get_remote_address
from asyncio import Queue
import mysql.connector
import uvicorn

# Suppress specific FutureWarnings
warnings.simplefilter(action='ignore', category=FutureWarning)

# Suppress TensorFlow oneDNN warnings
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)  # Set to DEBUG level for more detailed logs
app = FastAPI()

SECRET_KEY = "your_secret_key"  # Replace with a secure key
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        return username
    except JWTError:
        raise credentials_exception

class UserRegistration(BaseModel):
    username: str
    password: str
    email: EmailStr
    age: int
    weight: float
    height: float
    gender: str  # 'Male' or 'Female'
    activity: str  # e.g. 'No Exercise', 'Once a week', etc.
    goal: str  # e.g. 'maintain weight', 'lose weight', etc.
    requiredCalories: float



app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000",
    "https://localhost:3000",
    "http://localhost:8000",
    "https://localhost:8000",
    "https://*.ngrok-free.app",
    "http://*.ngrok-free.app",
    "http://7ef5-213-103-146-5.ngrok-free.app",
    "https://7ef5-213-103-146-5.ngrok-free.app",
    "http://5acb-213-103-146-5.ngrok-free.app",
    "https://5acb-213-103-146-5.ngrok-free.app",],  # Add your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=[
        "Content-Type",
        "Authorization",
        "Accept",
        "Origin",
        "ngrok-skip-browser-warning"
    ],
)

# Add an OPTIONS endpoint to handle preflight requests
@app.options("/token")
async def options_token():
    return {"status": "ok"}

# Define the database path
DATABASE_PATH = r"C:\Users\ranimeree\Desktop\APP\myapp\storeDB.db"
DATABASE_URL = "mysql+mysqlconnector://ranimeree:!R9a8n4i@store.c3a2sw62odx9.eu-north-1.rds.amazonaws.com:3306/storedb"  # Adjust credentials

engine = create_engine(
    DATABASE_URL,
    pool_size=20,
    pool_recycle=3600
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Create a password context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    role = Column(String, nullable=False)
    token = Column(String)
    created = Column(DateTime, default=datetime.utcnow)
    weight = Column(Float)
    height = Column(Float)
    age = Column(Integer)
    gender = Column(String)
    activity = Column(String)
    goal = Column(String)
    bmi = Column(Float)
    requiredCalories = Column(Float)
    is_verified = Column(Boolean, default=False)

Base.metadata.create_all(bind=engine)
class Food(Base):   
    __tablename__ = "foods"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    calories = Column(Float)  # Add calories column

SAVE_DIRECTORY = r"E:/calorie-estimation-app/images"

@app.post("/save-image")
async def save_image(image: UploadFile = File(...)):
    try:
        # Ensure the directory exists
        if not os.path.exists(SAVE_DIRECTORY):
            os.makedirs(SAVE_DIRECTORY)

        # Save the file
        file_path = os.path.join(SAVE_DIRECTORY, image.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)

        return {"message": f"Image saved to {file_path}"}
    except Exception as e:
        return {"error": str(e)}
    
@app.get("/api/foods/")
def get_foods():
    db = SessionLocal()
    foods = db.query(Food).all()
    return JSONResponse(content={"foods": [food.name for food in foods]})

@app.get("/api/calories/")
def get_calories():
    db = SessionLocal()
    foods = db.query(Food).all()
    return JSONResponse(content={"calories": [food.calories for food in foods]})

# Pydantic model for user login
class UserLogin(BaseModel):
    email: str
    password: str

# Function to connect to the MySQL database on AWS RDS
def get_db_connection():
    try:
        conn = mysql.connector.connect(
            host="store.c3a2sw62odx9.eu-north-1.rds.amazonaws.com",
            user="ranimeree",
            password="!R9a8n4i",
            database="storedb",  # Correct database name
            port=3306
        )
        logger.debug("Database connection successful")
        return conn
    except Exception as e:
        logger.error(f"Database connection failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Database connection failed"
        )

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

async def get_user(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

# Remove the async from this function since SQLAlchemy operations are synchronous
def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

@app.post("/token")
async def login_for_access_token(request: Request, form_data: OAuth2PasswordRequestForm = Depends()):
    print("1. Received login request")
    print("2. Headers:", dict(request.headers))
    print("3. Form data:", form_data)
    
    db = SessionLocal()
    try:
        user = get_user_by_email(db, form_data.username)
        
        if not user:
            raise HTTPException(
                status_code=400,
                detail="Incorrect email or password"
            )
            
        if not verify_password(form_data.password, user.password):
            raise HTTPException(
                status_code=400,
                detail="Incorrect email or password"
            )
            
        if not user.is_verified:
            # Generate new verification code
            code = generate_verification_code()
            verification_codes[user.email] = {
                "code": code,
                "user_data": {
                    "id": user.id,
                    "email": user.email,
                    "username": user.username
                }
            }
            send_verification_code(user.email, code)
            
            raise HTTPException(
                status_code=403,
                detail="Email not verified. Verification code sent."
            )
        
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email, "username": user.username, "user_id": user.id},
            expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_id": user.id,
            "username": user.username
        }
    finally:
        db.close()

@app.post("/signup")
async def signup(user: UserRegistration):
    try:
        print("Starting signup process for email:", user.email)  # New log
        db = SessionLocal()
        
        # Check if email already exists
        existing_user = db.query(User).filter(User.email == user.email).first()
        if existing_user:
            print(f"Found existing user for email {user.email}, verified status: {existing_user.is_verified}")  # New log
            if not existing_user.is_verified:
                # Generate and send new verification code
                code = generate_verification_code()
                print(f"Generated new verification code for existing user: {code}")  # New log
                verification_codes[user.email] = {
                    "code": code,
                    "user_data": user.dict()
                }
                print(f"Stored verification code in memory: {verification_codes[user.email]}")  # New log
                send_verification_code(user.email, code)
                return JSONResponse(
                    status_code=200,
                    content={"success": True, "message": "Verification code resent", "needs_verification": True}
                )
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": "Email already registered"}
            )

        # Hash the password
        hashed_password = hash_password(user.password)
        
        # Create new user with verification pending
        new_user = User(
            username=user.username,
            password=hashed_password,
            email=user.email,
            age=user.age,
            weight=user.weight,
            height=user.height,
            gender=user.gender,
            activity=user.activity,
            goal=user.goal,
            requiredCalories=user.requiredCalories,
            role="user",
            is_verified=False
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)  # Get the new user's ID

        # Call update_user with all required fields
        await update_user(
            user_id=new_user.id, 
            user_data={
                "user_id": new_user.id,
                "weight": user.weight,
                "age": user.age,
                "activity": user.activity,
                "goal": user.goal,
                "required_calories": user.requiredCalories,
                "date": datetime.utcnow().date().isoformat()  # Current date in YYYY-MM-DD format
            },
            db=db
        )

        # Generate and send verification code
        code = generate_verification_code()
        verification_codes[user.email] = {
            "code": code,
            "user_data": user.dict()
        }
        
        # Add logging for verification code generation
        logger.info(f"Generated verification code for {user.email}: {code}")
        
        verification_codes[user.email] = {
            "code": code,
            "user_data": user.dict()
        }
        
        logger.info(f"Stored verification codes after signup: {verification_codes}")
        
        # Send verification code
        if send_verification_code(user.email, code):
            logger.info(f"Verification code sent successfully to {user.email}")
        else:
            logger.error(f"Failed to send verification code to {user.email}")

        return JSONResponse(
            status_code=200,
            content={"success": True, "message": "User created. Please verify your email."}
        )

    except Exception as e:
        logger.error(f"Signup error: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": f"Registration failed: {str(e)}"}
        )



class Submission(BaseModel):
    user_id: int
    foods_id: int
    count: float
    food_calories: float
    date: str  # Format: YYYY-MM-DD

from fastapi import Form, UploadFile, File

@app.post("/submit/")
async def submit_intake(
    user_id: int = Form(...),
    foods_id: int = Form(...),
    food_name: str = Form(...),
    count: float = Form(...),
    food_calories: float = Form(...),
    carbs: float = Form(...),
    protein: float = Form(...),
    fats: float = Form(...),
    date: str = Form(...)
):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO intake 
            (user_id, foods_id, food_name, count, food_calories, food_carbs, food_protein, food_fats, date)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (user_id, foods_id, food_name, count, food_calories, carbs, protein, fats, date))
        
        conn.commit()
        return {"message": "Food intake submitted successfully"}
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.post("/upload_image/")
async def upload_image(image: UploadFile = File(...)):
    file_location = os.path.join(SAVE_DIRECTORY, "captured_image.png")
    with open(file_location, "wb") as file:
        file.write(await image.read())  # Save image

    return {"message": "Image uploaded successfully."}

@app.get("/intake/{user_id}")
async def get_user_intake(user_id: int):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Simplified query without join
        cursor.execute("""
            SELECT * FROM intake 
            WHERE user_id = %s
        """, (user_id,))
        
        rows = cursor.fetchall()
        return {"intake": rows}
    except Exception as e:
        logger.error(f"Error fetching intake: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

class UserUpdate(BaseModel):
    weight: float
    activity: str
    goal: str

# Define a Pydantic model for user updates
class UserUpdate(BaseModel):
    
    weight: float
    activity: str
    goal: str

# Dependency to get the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.put("/update_user/{user_id}")
async def update_user(user_id: int, user_data: dict, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")


        # Update user data
        user.weight = user_data.get("weight", user.weight)
        user.activity = user_data.get("activity", user.activity)
        user.goal = user_data.get("goal", user.goal)

        # Calculate new required calories using all necessary parameters
        user.requiredCalories = calculate_required_calories(
            weight=user.weight,
            height=user.height,
            age=user.age,
            gender=user.gender,
            activity=user.activity,
            goal=user.goal
        )

        # Insert into daily_user_stats
        insert_stmt = text("""
            INSERT INTO daily_user_stats 
            (user_id, date, weight, age, activity, goal, required_calories, created_at)
            VALUES
            (:user_id, CURRENT_TIMESTAMP, :weight, :age, :activity, :goal, :calories, CURRENT_TIMESTAMP)
        """)
        
        params = {
            "user_id": user_id,
            "weight": user.weight,
            "age": user.age,
            "activity": user.activity,
            "goal": user.goal,
            "calories": user.requiredCalories
        }

        db.execute(insert_stmt, params)
        db.commit()

        return {
            "message": "User information updated successfully", 
            "requiredCalories": user.requiredCalories
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating user: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

def calculate_required_calories(weight, height, age, gender, activity, goal):
    # Convert inputs to float/int to ensure proper calculation
    weight = float(weight)
    height = float(height)
    age = int(age)

    # Base calculation using Mifflin-St Jeor Equation
    if gender == 'Male':
        daily_calories = 10 * weight + 6.25 * height - 5 * age + 5
    else:
        daily_calories = 10 * weight + 6.25 * height - 5 * age - 161

    # Activity multiplier
    activity_levels = {
        'No Exercise': 1.2,
        'Once a week': 1.375,
        '2-3 time per week': 1.55,
        '4-5 times a week': 1.725,
    }
    daily_calories *= activity_levels.get(activity, 1.2)

    # Goal adjustment (ensure daily_calories is float)
    daily_calories = float(daily_calories)
    if goal == 'lose weight':
        daily_calories -= 500.0
    elif goal == 'gain weight':
        daily_calories += 500.0

    return daily_calories

@app.get("/get_user/{user_id}")
async def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "weight": user.weight,
        "height": user.height,
        "age": user.age,
        "gender": user.gender,
        "activity": user.activity,
        "goal": user.goal,
        "requiredCalories": user.requiredCalories
    }

# Initialize the model and processor
try:
    print("Loading food detection model...")
    model_name = "nateraw/food"  # This is specifically trained on food images
    extractor = AutoFeatureExtractor.from_pretrained(model_name)
    model = ResNetForImageClassification.from_pretrained(model_name)
    model.eval()
    print("Model loaded successfully")
except Exception as e:
    logger.error(f"Error loading model: {str(e)}")
    raise

model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

# Initialize OpenAI client (add your API key to environment variables)
client = OpenAI(api_key="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")

DEFAULT_LANGUAGE = "en"

# Helper function to get language from headers
def get_language(accept_language: Optional[str] = Header(None)) -> str:
    if not accept_language:
        return DEFAULT_LANGUAGE
    
    # Parse the Accept-Language header and get the first language
    try:
        # Accept-Language format: "fi,en;q=0.9,de;q=0.8"
        primary_language = accept_language.split(',')[0].strip().lower()
        # If language includes country code (e.g., "en-US"), take only language part
        return primary_language.split('-')[0]
    except:
        return DEFAULT_LANGUAGE

# Initialize the limiter
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

# Modify the process-food-image endpoint to handle cancellation better
@app.post("/process-food-image")
@limiter.limit("5/minute")
async def process_food_image(
    request: Request,
    image: UploadFile = File(...),
    accept_language: Optional[str] = Header(None)
):
    try:
        # Add request to queue
        await openai_request_queue.put("request")
        try:
            language = get_language(accept_language)
            
            logger.info(f"Starting image processing with language: {language}")
            
            contents = await image.read()
            if len(contents) == 0:
                raise HTTPException(status_code=400, detail="Empty file")
            
            base64_image = base64.b64encode(contents).decode('utf-8')
            
            try:
                # First API call to identify the food
                response = await asyncio.to_thread(
                    lambda: client.chat.completions.create(
                        model="gpt-4o",  # Fixed model name
                        messages=[
                            {
                                "role": "user",
                                "content": [
                                    {
                                        "type": "text",
                                        "text": language_prompt.get(language, language_prompt["en"])
                                    },
                                    {
                                        "type": "image_url",
                                        "image_url": {
                                            "url": f"data:image/jpeg;base64,{base64_image}"
                                        }
                                    }
                                ]
                            }
                        ],
                        max_tokens=300
                    )
                )

                response_content = response.choices[0].message.content.strip()
                logger.info(f"OpenAI response: {response_content}")

                # Step 2: Classify the food as raw or not raw
                classification_prompt = f"Is the food '{response_content}' raw or not raw? Please respond with 'raw' or 'not raw'."
                classification_response = await asyncio.to_thread(
                    lambda: client.chat.completions.create(
                        model="gpt-4",
                        messages=[
                            {
                                "role": "system",
                                "content": f"You are a food classification assistant. Always respond in {language}. Be precise and concise."
                            },
                            {
                                "role": "user",
                                "content": classification_prompt
                            }
                        ],
                        max_tokens=10
                    )
                )
                
                classification_result = classification_response.choices[0].message.content.strip().lower()
                logger.info(f"Classification result: {classification_result}")

                # Step 3: Handle raw or not raw classification
                if classification_result == "raw":
                    # Parse the response to get clean food name and nutritional values
                    parts = response_content.split(',')
                    food_name = parts[0].strip()
                    calories = float(parts[1].split()[0])
                    carbs = float(parts[2].split()[0])
                    protein = float(parts[3].split()[0])
                    fat = float(parts[4].split()[0])
                    
                    return JSONResponse(
                        content={
                            "success": True,
                            "food_name": food_name,
                            "nutritional_values": {
                                "calories": calories,
                                "carbs": carbs,
                                "protein": protein,
                                "fat": fat
                            }
                        }
                    )
                else:
                    # Get the food name from the initial response before processing ingredients
                    food_name = response_content.split(',')[0].strip()
                    
                    ingredients_prompt = (
                        f"Please list the ingredients for '{food_name}' in this exact format:\n"
                        f"- ingredient_name calories_per_gram cal/g carbs_per_gram carb/g protein_per_gram protein/g fat_per_gram fat/g amount_in_grams\n"
                        f"For example:\n"
                        f"- flour 3.0 cal/g 0.7 carb/g 0.1 protein/g 0.01 fat/g 100\n"
                        f"- tomato 0.2 cal/g 0.05 carb/g 0.01 protein/g 0.002 fat/g 50\n"
                        f"Please follow this format exactly, with one ingredient per line, starting with a dash."
                    )

                    ingredients_response = await asyncio.to_thread(
                        lambda: client.chat.completions.create(
                            model="gpt-4",
                            messages=[
                                {
                                    "role": "system",
                                    "content": "You are a food ingredient assistant. Always respond with a list of ingredients in the specified format."
                                },
                                {
                                    "role": "user",
                                    "content": ingredients_prompt
                                }
                            ],
                            max_tokens=150
                        )
                    )
                    
                    ingredients_content = ingredients_response.choices[0].message.content.strip()
                    logger.info(f"Raw Ingredients Response: {ingredients_content}")

                    # Parse the ingredients content
                    structured_ingredients = []  # Initialize empty list
                    lines = [line.strip() for line in ingredients_content.split('\n') 
                            if line.strip() and line.strip().startswith('-')]

                    for line in lines:
                        # Remove the leading dash and trim
                        line = line.replace('-', '').strip()
                        print(f"Processing line: {line}")  # Debug: Print each line

                        if line:
                            # Use regex to match the expected format
                            match = re.match(r"([^0-9]+?)\s+([\d.]+)\s+cal/g\s+([\d.]+)\s+carb/g\s+([\d.]+)\s+protein/g\s+([\d.]+)\s+fat/g\s+(\d+)", line)
                            if match:
                                name = match.group(1).strip()
                                calories = float(match.group(2))
                                carbs = float(match.group(3))
                                protein = float(match.group(4))
                                fat = float(match.group(5))
                                amount = float(match.group(6))
                                structured_ingredients.append({
                                    "name": name,
                                    "calories": calories,
                                    "carbs": carbs,
                                    "protein": protein,
                                    "fat": fat,
                                    "amount": amount
                                })
                                print(f"Added ingredient: {structured_ingredients[-1]}")
                            else:
                                logger.error(f"Line format not recognized: '{line}'")

                    logger.info(f"Structured Ingredients: {structured_ingredients}")
                    
                    return JSONResponse(
                        content={
                            "success": True,
                            "food_name": food_name,
                            "ingredients": structured_ingredients
                        }
                    )

            except asyncio.TimeoutError:
                logger.error("OpenAI API request timed out")
                raise HTTPException(
                    status_code=504,
                    detail=error_messages.get(language, error_messages["en"]) + " (timeout)"
                )

        finally:
            # Remove from queue when done
            openai_request_queue.get_nowait()
            
        return # ... your existing return statement ...
        
    except Exception as e:
        logger.error(f"Error processing food image: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


def parse_ingredients(ingredients_text):
    ingredients = []
    for line in ingredients_text.split('\n'):
        if line.strip():
            parts = line.strip().split()
            if len(parts) >= 3:
                try:
                    ingredients.append({
                        "name": " ".join(parts[:-2]),
                        "calories": float(parts[-2]),
                        "amount": float(parts[-1])
                    })
                except ValueError:
                    continue
    return ingredients

# Add helper function for saving images
async def save_image_to_disk(contents: bytes, file_path: str):
    try:
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, "wb") as buffer:
            buffer.write(contents)
        logger.info(f"Image saved successfully to {file_path}")
    except Exception as e:
        logger.error(f"Error saving image: {str(e)}")

def get_food_id_by_name(food_name: str, db_connection):
    cursor = db_connection.cursor()
    cursor.execute("SELECT id FROM foods WHERE name = ?", (food_name,))
    result = cursor.fetchone()
    return result[0] if result else None

@app.get("/daily_user_stats/{user_id}")
async def get_daily_user_stats(user_id: int):
    # Logic to fetch daily user stats from the database
    db = SessionLocal()
    stats = db.query(DailyUserStats).filter(DailyUserStats.user_id == user_id).all()
    if not stats:
        raise HTTPException(status_code=404, detail="No stats found for this user")
    return stats

# Define the DailyUserStats model
class DailyUserStats(Base):
    __tablename__ = "daily_user_stats"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer)
    date = Column(DateTime)
    weight = Column(Float)
    age = Column(Integer)
    activity = Column(String)
    goal = Column(String)
    required_calories = Column(Float)
    created_at = Column(DateTime)

# Add this new model after your existing models
class UserFood():
    __tablename__ = "user_foods"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)
    calories = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

# Add these new endpoints
@app.get("/api/user-foods/{user_id}")
async def get_user_foods(user_id: int):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)  # Use dictionary=True to get results as dicts
        
        logger.info(f"Fetching foods for user_id: {user_id}")
        
        cursor.execute("""
            SELECT recipe_name, calories_per_gram, carbs_per_gram, protein_per_gram, fats_per_gram 
            FROM user_recipes 
            WHERE user_id = %s
        """, (user_id,))
        
        recipes = cursor.fetchall()
        
        if not recipes:
            return {"success": False, "message": "No recipes found for this user"}
        
        return {"success": True, "recipes": recipes}
    except Exception as e:
        logger.error(f"Error fetching user recipes: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
    finally:
        if conn:
            conn.close()

@app.post("/api/save-user-food")
async def save_user_food(
    user_id: int = Form(...),
    food_name: str = Form(...),
    calories: float = Form(...),
    carbs: float = Form(...),
    protein: float = Form(...),
    fats: float = Form(...)
):
    try:
        print("Received request with data:")
        print(f"user_id: {user_id}, food_name: {food_name}, calories: {calories}, carbs: {carbs}, protein: {protein}, fats: {fats}")

        conn = mysql.connector.connect(
            host="localhost",
            user="username",
            password="password",
            database="storeDB"
        )
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO user_foods (user_id, name, calories, carbs, protein, fats)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (user_id, food_name, calories, carbs, protein, fats))
        
        conn.commit()
        conn.close()
        
        return {"success": True, "message": "Food saved successfully"}
    except mysql.connector.IntegrityError:
        print("Integrity error: Food name already exists for this user")
        raise HTTPException(status_code=409, detail="Food name already exists for this user")
    except Exception as e:
        print(f"Error saving food: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/user-foods/{user_id}/{food_name}")
async def delete_user_food(user_id: int, food_name: str):
    db = SessionLocal()
    try:
        food = db.query(UserFood).filter(
            UserFood.user_id == user_id,
            UserFood.name == food_name
        ).first()
        
        if food:
            db.delete(food)
            db.commit()
            return JSONResponse(content={"success": True, "message": "Food deleted successfully"})
        return JSONResponse(
            status_code=404,
            content={"success": False, "message": "Food not found"}
        )
    finally:
        db.close()

@app.put("/api/update-user-food/{user_id}/{food_name}")
async def update_user_food(
    user_id: int,
    food_name: str,
    new_name: str = Form(...),
    calories: float = Form(...)
):
    db = SessionLocal()
    try:
        food = db.query(UserFood).filter(
            UserFood.user_id == user_id,
            UserFood.name == food_name
        ).first()
        
        if food:
            food.name = new_name
            food.calories = calories
            db.commit()
            return JSONResponse(content={"success": True, "message": "Food updated successfully"})
        return JSONResponse(
            status_code=404,
            content={"success": False, "message": "Food not found"}
        )
    finally:
        db.close()

@app.delete("/intake/{user_id}/{record_id}")
async def delete_intake(user_id: int, record_id: int):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Debug logging
        logger.info(f"Attempting to delete intake record: user_id={user_id}, record_id={record_id}")

        # Use %s instead of ? for MySQL parameter placeholders
        cursor.execute("DELETE FROM intake WHERE user_id = %s AND id = %s", (user_id, record_id))
        conn.commit()

        if cursor.rowcount == 0:
            logger.warning(f"No intake record found for user_id={user_id}, record_id={record_id}")
            raise HTTPException(status_code=404, detail="Intake record not found")

        logger.info(f"Successfully deleted intake record: user_id={user_id}, record_id={record_id}")
        return {"message": "Intake record deleted successfully"}

    except Exception as e:
        logger.error(f"Error deleting intake record: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()
            logger.info("Database connection closed")

language_prompt = {
    "en": "What food item is shown in this image? Please respond with the food name followed by calories, carbs, protein, and fat per gram, separated by commas. For example: 'Food Name, 2.5 cal/g, 0.5 carb/g, 0.3 protein/g, 0.2 fat/g'. If no food is detected, respond with 'No food detected'.",
    
    "ar": "ما هو الطعام الظاهر في هذه الصورة؟ يري الرد باسم الطعام متبوعًا بالسعرات الحرارية لكل جرام، مفصولة بفاصلة. مثال: 'اسم الطعام، 2.5 سعرة/جم'. إذا لم يتم اكتشاف طعام، الرجاء الرد 'لم يتم اكتشاف طعام'.",
    
    "es": "¿Qué alimento se muestra en esta imagen? Por favor, responda con el nombre del alimento seguido de las calorías por gramo, separados por una coma. Por ejemplo: 'Nombre del alimento, 2.5 cal/g'. Si no se detecta ningún alimento, responda 'No se detectó alimento'.",
    
    "it": "Quale cibo è mostrato in questa immagine? Per favore, rispondi con il nome del cibo seguito dalle calorie per grammo, separati da una virgola. Per esempio: 'Nome del cibo, 2.5 cal/g'. Se non viene rilevato alcun cibo, rispondi 'Nessun cibo rilevato'.",
    
    "sv": "Vilken mat visas i denna bild? Svara med matens namn följt av kalorier per gram, separerade med komma. Till exempel: 'Matnamn, 2.5 kal/g'. Om ingen mat upptäcks, svara 'Ingen mat upptäckt'.",
    
    "de": "Welches Lebensmittel ist auf diesem Bild zu sehen? Bitte antworten Sie mit dem Namen des Lebensmittels gefolgt von Kalorien pro Gramm, getrennt durch ein Komma. Zum Beispiel: 'Lebensmittelname, 2.5 kal/g'. Wenn kein Lebensmittel erkannt wird, antworten Sie 'Kein Lebensmittel erkannt'.",
    
    "nl": "Welk voedsel wordt er in deze afbeelding getoond? Antwoord met de naam van het voedsel gevolgd door calorieën per gram, gescheiden door een komma. Bijvoorbeeld: 'Voedselnaam, 2.5 cal/g'. Als er geen voedsel wordt gedetecteerd, antwoord dan 'Geen voedsel gedetecteerd'.",
    
    "fr": "Quel aliment est montré dans cette image ? Veuillez répondre avec le nom de l'aliment suivi des calories par gramme, séparés par une virgule. Par exemple : 'Nom de l'aliment, 2.5 cal/g'. Si aucun aliment n'est détecté, répondez 'Aucun aliment détecté'.",
    
    "fa": "چه غذایی در این تصویر نشان داده شده است؟ لطفاً نام غذا را به همراه کالری در هر گرم، جدا شده با کاما، ذکر کنید. مثال: 'نام غذا، 2.5 کالری/گرام'. اگر غذایی تشخیص داده نشد، پاسخ دهید 'غذایی تشخیص داده نشد'.",
    
    "fi": "Mikä ruoka tässä kuvassa näkyy? Vastaa ruoan nimellä ja sen jälkeen kalorit per gramma pilkulla erotettuna. Esimerkiksi: 'Ruoan nimi, 2.5 kal/g'. Jos ruokaa ei tunnisteta, vastaa 'Ruokaa ei tunnistettu'.",
    
    "da": "Hvilken mad vises på dette billede? Svar venligst med madens navn efterfulgt af kalorier pr. gram, adskilt med komma. For eksempel: 'Madnavn, 2.5 kal/g'. Hvis ingen mad registreres, svar 'Ingen mad registreret'.",
    
    "el": "Ποιο φαγητό φαίνεται σε αυτήν την εικόνα; Παρακαλώ απαντήστε με το όνομα του φαγητού ακολουθούμενο από θερμίδες ανά γραμμάριο, χωρισμένα με κόμμα. Για παράδειγμα: 'Όνομα φαγητού, 2.5 θερμίδες/γρ'. Εάν δεν ανιχνευθεί φαγητό, απαντήστε 'Δεν ανιχνεύθηκε φαγητό'.",
    
    "ru": "Какая еда показана на этом изображении? Пожалуйста, ответьте названием еды, за которым следует количество калорий на грамм, разделенные запятыми. Например: 'Название еды, 2.5 кал/г'. Если еда не обнаружена, ответьте 'Еда не обнаружена'.",
    
    "tr": "Bu görüntüde hangi yiyecek gösteriliyor? Lütfen yiyecek adını ve gram başına kaloriyi virgülle ayırarak yanıtlayın. Örneğin: 'Yiyecek adı, 2.5 kal/g'. Eğer yiyecek tespit edilemezse, 'Yiyecek tespit edilemedi' şeklinde yanıtlayın.",
    
    "pt": "Que alimento é mostrado nesta imagem? Por favor, responda com o nome do alimento seguido de calorias por grama, separados por vírgula. Por exemplo: 'Nome do alimento, 2.5 cal/g'. Se nenhum alimento for detectado, responda 'Nenhum alimento detectado'.",
    
    "ja": "この画像にはどんな食べ物が写っていますか？食べ物の名前とグラムあたりのカロリーをカンマで区切って答えてください。例：'食べ物の名前、2.5カロリー/g'。食べ物が検出されない場合は、'食べ物が検出されません'と答えてください。",
    
    "hi": "इस छव में कौन सा खाद्य पदार्थ दिखाया गया है? कृपया खाद्य पदार्थ का नाम और प्रति ग्राम कैलोरी अल्पविराम से अलग करके उत्तर दें। उदाहरण: 'खाद्य पदार्थ का नाम, 2.5 कैलोरी/ग्राम'। यदि कोई खाद्य पदार्थ नहीं मिलता है, तो 'कोई खाद्य पदार्थ नहीं मिलता है' उत्तर दें।",
    
    "ku": "لەم وێنەیەدا چ خواردنێک پیشان دراوە؟ تکایە بە ناوی خواردنەکە و کالۆری بۆ هەر گرامێک وەڵا بدەوە، بە کۆما جیا کراوەتەوە. بۆ نموونە: 'ناوی خواردن، 2.5 کالۆری/گرام'. ئەگەر هیچ خواردنێک نەدۆزرایەوە، وەڵام بدەوە 'هیچ خواردنێک نەدۆزرایەوە'."
}

# Add this new dictionary for text processing prompts
text_language_prompt = {
    "en": "What are the nutritional values per gram for this food: {food_name}? Please respond with the food name followed by calories, carbs, protein, and fat per gram, separated by commas. For example: 'Food Name, 2.5 cal/g, 0.5 carb/g, 0.3 protein/g, 0.2 fat/g'. If this is not a food item, respond with 'Not a food item'.",
    
    "ar": "كم عدد السعرات الحرارية لكل جرام من هذا الطعام: {food_name}؟ يرجى الرد باسم الطعام متبوعًا بالسعرات الحرارية لكل جرام، مفصولة بفاصلة. مثال: 'اسم الطعام، 2.5 سعرة/جم'. إذا لم يكن هذا طعامًا، الرجاء الرد 'ليس طعاماً'.",
    
    "es": "¿Cuántas calorías por gramo tiene este alimento: {food_name}? Por favor, responda con el nombre del alimento seguido de las calorías por gramo, separados por una coma. Por ejemplo: 'Nombre del alimento, 2.5 cal/g'. Si no es un alimento, responda 'No es un alimento'.",
    
    "it": "Quante calorie per grammo ha questo cibo: {food_name}? Per favore, rispondi con il nome del cibo seguito dalle calorie per grammo, separati da una virgola. Per esempio: 'Nome del cibo, 2.5 cal/g'. Se non è un alimento, rispondi 'Non è un alimento'.",
    
    "sv": "Hur många kalorier per gram har denna mat: {food_name}? Svara med matens namn följt av kalorier per gram, separerade med komma. Till exempel: 'Matnamn, 2.5 kal/g'. Om det inte är mat, svara 'Inte ett livsmedel'.",
    
    "de": "Wie viele Kalorien pro Gramm hat dieses Lebensmittel: {food_name}? Bitte antworten Sie mit dem Namen des Lebensmittels gefolgt von Kalorien pro Gramm, getrennt durch ein Komma. Zum Beispiel: 'Lebensmittelname, 2.5 kal/g'. Wenn es kein Lebensmittel ist, antworten Sie 'Kein Lebensmittel'.",
    
    "nl": "Hoeveel calorieën per gram bevat dit voedsel: {food_name}? Antwoord met de naam van het voedsel gevolgd door calorieën per gram, gescheiden door een komma. Bijvoorbeeld: 'Voedselnaam, 2.5 cal/g'. Als het geen voedsel is, antwoord dan 'Geen voedsel'.",
    
    "fr": "Combien de calories par gramme contient cet aliment : {food_name}? Veuillez répondre avec le nom de l'aliment suivi des calories par gramme, séparés par une virgule. Par exemple : 'Nom de l'aliment, 2.5 cal/g'. Si ce n'est pas un aliment, répondez 'Pas un aliment'.",
    
    "fa": "چند کالری در هر گرم این غذا وجود دارد: {food_name}؟ لطفاً نام غذا را به همراه کالری در هر گرم، جدا شده با کاما، ذکر کنید. مثال: 'نام غذا، 2.5 کالری/گرام'. اگر این یک ماده غذایی نیست، پاسخ دهید 'این یک ماده غذایی نیست'.",
    
    "fi": "Kuinka monta kaloria per gramma tässä ruoassa on: {food_name}? Vastaa ruoan nimellä ja sen jälkeen kalorit per gramma pilkulla erotettuna. Esimerkiksi: 'Ruoan nimi, 2.5 kal/g'. Jos kyseessä ei ole ruoka, vastaa 'Ei ole ruoka'.",
    
    "da": "Hvor mange kalorier per gram indeholder denne mad: {food_name}? Svar venligst med madens navn efterfulgt af kalorier pr. gram, adskilt med komma. For eksempel: 'Madnavn, 2.5 kal/g'. Hvis det ikke er mad, svar 'Ikke mad'.",
    
    "el": "Πόσες θερμίδες ανά γραμμάριο έχει αυτό το τρόφιμο: {food_name}; Παρακαλώ απαντήστε με το όνομα του φαγητού ακολουθούμενο από θερμίδες ανά γραμμάριο, χωρισμένα με κόμμα. Για παράδειγμα: 'Όνομα φαγητού, 2.5 θερμίδες/γρ'. Εάν δεν είναι τρόφιμο, απαντήστε 'Δεν είναι τρόφιμο'.",
    
    "ru": "Сколько калорий на грамм в этом продукте: {food_name}? Пожалуйста, ответьте названием еды, за которым следует количество калорий на грамм, разделенные запятыми. Например: 'Название еды, 2.5 кал/г'. Если это не еда, ответьте 'Не является едой'.",
    
    "tr": "Bu yiyeceğin gram başına kalorisi nedir: {food_name}? Lütfen yiyecek adını ve gram başına kaloriyi virgülle ayırarak yanıtlayın. Örneğin: 'Yiyecek adı, 2.5 kal/g'. Eğer bu bir yiyecek değilse, 'Yiyecek değil' şeklinde yanıtlayın.",
    
    "pt": "Quantas calorias por grama tem este alimento: {food_name}? Por favor, responda com o nome do alimento seguido de calorias por grama, separados por vírgula. Por exemplo: 'Nome do alimento, 2.5 cal/g'. Se não for um alimento, responda 'Não é um alimento'.",
    
    "ja": "この食品のグラムあたりのカロリーはいくつですか: {food_name}？食べ物名前とグラムあたりのカロリーをカンマで区切って答えてください。例：'食べ物の名前、2.5カロリー/g'。食べ物でない場合は、'食べ物ではありません'と答えてください。",
    
    "hi": "इस खाद्य पदार्थ में प्रति ग्राम कितनी कैलोरी है: {food_name}? कृपया खाद्य पदार्थ का नाम और प्रति ग्राम कैलोरी अल्पविराम से अलग करके उत्तर दें। उदाहरण: 'खाद्य पदार्थ का नाम, 2.5 कैलोरी/ग्राम'। यदि यह खाद्य पदार्थ नहीं है, तो 'यह खाद्य पदार्थ नहीं है' उत्तर दें।",
    
    "ku": "ئەم خواردنە چەند کالۆری هەیە بۆ هەر گرامێک: {food_name}؟ تکایە بە ناوی خواردنەکە و کالۆری بۆ هەر گرامێک وەڵام بدەوە، بە کۆما جیا کراوەتەوە. بۆ نموونە: 'ناوی خواردن، 2.5 کالۆری/گرام'. ئەگەر ئەمە خواردن نییە، وەڵام بدەوە 'ئەمە خواردن نییە'."
}

# Load the CSV file
csv_file_path = os.path.join(os.path.dirname(__file__), 'nutrition.csv')
nutrition_data = pd.read_csv(csv_file_path)

def find_nutritional_values(food_description):
    # Use fuzzy matching to find the closest match
    choices = nutrition_data['food'].tolist()
    best_match, score = process.extractOne(food_description, choices)
    
    if score > 80:  # Adjust the threshold as needed
        # Retrieve the row with the best match
        row = nutrition_data[nutrition_data['food'] == best_match].iloc[0]
        return row.to_dict()
    return None

@app.post("/process-food-text")
async def process_food_text(food_name: str = Form(...), accept_language: Optional[str] = Header(None)):
    try:
        # Add request to queue
        await openai_request_queue.put("request")
        
        try:
            language = get_language(accept_language)
            logger.info(f"Processing food text: {food_name} with language: {language}")
            
            # Step 1: Get the food name and basic nutritional info
            prompt = text_language_prompt.get(language, text_language_prompt["en"]).format(
                food_name=food_name
            )
            
            try:
                response = await asyncio.to_thread(
                    lambda: client.chat.completions.create(
                        model="gpt-4",
                        messages=[
                            {
                                "role": "system",
                                "content": f"You are a food nutrition assistant. Always respond in {language}. Be precise and concise."
                            },
                            {
                                "role": "user",
                                "content": prompt
                            }
                        ],
                        max_tokens=100
                    )
                )
                
                response_content = response.choices[0].message.content.strip()
                logger.info(f"OpenAI response: {response_content}")

                # Step 2: Classify the food as raw or not raw
                classification_prompt = f"Is the food '{response_content}' raw or not raw? Please respond with 'raw' or 'not raw'."
                classification_response = await asyncio.to_thread(
                    lambda: client.chat.completions.create(
                        model="gpt-4",
                        messages=[
                            {
                                "role": "system",
                                "content": f"You are a food classification assistant. Always respond in {language}. Be precise and concise."
                            },
                            {
                                "role": "user",
                                "content": classification_prompt
                            }
                        ],
                        max_tokens=10
                    )
                )
                
                classification_result = classification_response.choices[0].message.content.strip().lower()
                logger.info(f"Classification result: {classification_result}")

                if classification_result == "raw":
                    # Parse the response to get clean food name and nutritional values
                    parts = response_content.split(',')
                    food_name = parts[0].strip()
                    calories = float(parts[1].split()[0])
                    carbs = float(parts[2].split()[0])
                    protein = float(parts[3].split()[0])
                    fat = float(parts[4].split()[0])
                    
                    return JSONResponse(
                        content={
                            "success": True,
                            "food_name": food_name,
                            "nutritional_values": {
                                "calories": calories,
                                "carbs": carbs,
                                "protein": protein,
                                "fat": fat
                            }
                        }
                    )
                else:
                    ingredients_prompt = (
                        f"Please list the ingredients for '{food_name}' in this exact format:\n"
                        f"- ingredient_name calories_per_gram cal/g carbs_per_gram carb/g protein_per_gram protein/g fat_per_gram fat/g amount_in_grams\n"
                        f"For example:\n"
                        f"- flour 3.0 cal/g 0.7 carb/g 0.1 protein/g 0.01 fat/g 100\n"
                        f"- tomato 0.2 cal/g 0.05 carb/g 0.01 protein/g 0.002 fat/g 50\n"
                        f"Please follow this format exactly, with one ingredient per line, starting with a dash."
                    )

                    ingredients_response = await asyncio.to_thread(
                        lambda: client.chat.completions.create(
                            model="gpt-4",
                            messages=[
                                {
                                    "role": "system",
                                    "content": "You are a food ingredient assistant. Always respond with a list of ingredients in the specified format."
                                },
                                {
                                    "role": "user",
                                    "content": ingredients_prompt
                                }
                            ],
                            max_tokens=150
                        )
                    )
                    
                    ingredients_content = ingredients_response.choices[0].message.content.strip()
                    logger.info(f"Raw Ingredients Response: {ingredients_content}")

                    # Parse the ingredients content
                    structured_ingredients = []  # Initialize empty list
                    lines = [line.strip() for line in ingredients_content.split('\n') 
                            if line.strip() and line.strip().startswith('-')]

                    for line in lines:
                        # Remove the leading dash and trim
                        line = line.replace('-', '').strip()
                        print(f"Processing line: {line}")  # Debug: Print each line

                        if line:
                            # Use regex to match the expected format
                            match = re.match(r"([^0-9]+?)\s+([\d.]+)\s+cal/g\s+([\d.]+)\s+carb/g\s+([\d.]+)\s+protein/g\s+([\d.]+)\s+fat/g\s+(\d+)", line)
                            if match:
                                name = match.group(1).strip()
                                calories = float(match.group(2))
                                carbs = float(match.group(3))
                                protein = float(match.group(4))
                                fat = float(match.group(5))
                                amount = float(match.group(6))
                                structured_ingredients.append({
                                    "name": name,
                                    "calories": calories,
                                    "carbs": carbs,
                                    "protein": protein,
                                    "fat": fat,
                                    "amount": amount
                                })
                                print(f"Added ingredient: {structured_ingredients[-1]}")
                            else:
                                logger.error(f"Line format not recognized: '{line}'")

                    logger.info(f"Structured Ingredients: {structured_ingredients}")
                    
                    return JSONResponse(
                        content={
                            "success": True,
                            "food_name": food_name,
                            "ingredients": structured_ingredients
                        }
                    )

            except asyncio.CancelledError:
                logger.error("Request was cancelled")
                raise HTTPException(
                    status_code=499,
                    detail="Request cancelled"
                )
            except asyncio.TimeoutError:
                logger.error("OpenAI API request timed out")
                raise HTTPException(
                    status_code=504,
                    detail=error_messages.get(language, error_messages["en"]) + " (timeout)"
                )

        finally:
            # Remove request from queue
            try:
                openai_request_queue.get_nowait()
            except asyncio.QueueEmpty:
                pass

    except Exception as e:
        logger.error(f"Error processing food text: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while processing the food text."
        )

# At the top of main.py with other constants
error_messages = {
    "en": "An error occurred while processing the request",
    "tr": "İstek işlenirken bir hata oluştu",
    "ru": "Произошла ошибка при обработке запроса",
    "pt": "Ocorreu um erro ao processar a solicitação",
    "ja": "リクエストの処理中にエラーが発生しました",
    "ku": "هەڵەیەک ڕوویدا لە کاتی پرۆسەکردنی داواکارییەکە"
}

general_error_messages = error_messages  # Alias for backward compatibility

# Add this after your FastAPI app initialization
app.include_router(email_verification_router)

# Add this to store reset codes (similar to verification_codes)
password_reset_codes = {}

# Add this class for request validation
class PasswordResetRequest(BaseModel):
    email: str

@app.post("/request-password-reset")
async def request_password_reset(request: PasswordResetRequest):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == request.email).first()
        if not user:
            raise HTTPException(status_code=404, detail="Email not found")

        # Generate 6-digit reset code
        reset_code = ''.join(random.choices(string.digits, k=6))
        
        # Store the code with expiration (30 minutes)
        password_reset_codes[request.email] = {
            "code": reset_code,
            "expiry": datetime.utcnow() + timedelta(minutes=30)
        }

        # Send email with reset code
        email_sent = send_verification_code(request.email, reset_code)  # Reuse your existing email function
        
        if email_sent:
            return {"message": "Password reset code sent successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to send reset code")

    except Exception as e:
        logger.error(f"Password reset error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

# Add this class for password reset validation
class PasswordReset(BaseModel):
    email: str
    reset_code: str
    new_password: str

@app.post("/reset-password")
async def reset_password(request: PasswordReset):
    db = SessionLocal()
    try:
        # Verify the reset code
        stored_data = password_reset_codes.get(request.email)
        if not stored_data:
            raise HTTPException(status_code=400, detail="Invalid or expired reset code")

        if datetime.utcnow() > stored_data["expiry"]:
            del password_reset_codes[request.email]
            raise HTTPException(status_code=400, detail="Reset code has expired")

        if stored_data["code"] != request.reset_code:
            raise HTTPException(status_code=400, detail="Invalid reset code")

        # Update password
        user = db.query(User).filter(User.email == request.email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Hash the new password
        user.password = pwd_context.hash(request.new_password)
        db.commit()

        # Remove the used reset code
        del password_reset_codes[request.email]

        return {"message": "Password reset successfully"}

    except Exception as e:
        logger.error(f"Password reset error: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()
# Add this near your other imports at the top
from asyncio import Queue
openai_request_queue = Queue(maxsize=10)

class RecipeCreate(BaseModel):
    user_id: int
    recipe_name: str
    calories_per_gram: float
    carbs_per_gram: float
    protein_per_gram: float
    fats_per_gram: float
    ingredients: list

@app.post('/api/save-recipe')
async def save_recipe(recipe: RecipeCreate):
    try:
        # Create database connection
        conn = get_db_connection()
        cursor = conn.cursor()

        # Insert recipe
        cursor.execute("""
            INSERT INTO user_recipes 
            (user_id, recipe_name, calories_per_gram, carbs_per_gram, protein_per_gram, fats_per_gram)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (recipe.user_id, recipe.recipe_name, recipe.calories_per_gram, 
              recipe.carbs_per_gram, recipe.protein_per_gram, recipe.fats_per_gram))
        
        recipe_id = cursor.lastrowid  # Get the last inserted row id

        # Insert ingredients
        for ingredient in recipe.ingredients:
            cursor.execute("""
                INSERT INTO recipe_ingredients 
                (recipe_id, ingredient_name, calories_per_gram, carbs_per_gram, 
                protein_per_gram, fats_per_gram, amount)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (recipe_id, ingredient['name'], ingredient['calories'], 
                  ingredient['carbs'], ingredient['protein'], ingredient['fat'], 
                  ingredient['amount']))

        conn.commit()
        conn.close()
        return {"success": True, "message": "Recipe saved successfully", "recipe_id": recipe_id}

    except Exception as e:
        logger.error(f"Error saving recipe: {str(e)}")
        return {"success": False, "message": str(e)}

@app.get('/api/user-recipes/{user_id}')
async def get_user_recipes(user_id: int):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get recipes
        query = """
            SELECT id, recipe_name, calories_per_gram as calories, 
                   carbs_per_gram as carbs, protein_per_gram as protein, 
                   fats_per_gram as fats
            FROM user_recipes 
            WHERE user_id = %s
        """
        logger.debug(f"Executing recipe query for user_id: {user_id}")
        cursor.execute(query, (user_id,))
        recipes = cursor.fetchall()
        
        if not recipes:
            logger.debug("No recipes found for user")
            return {
                "success": True,
                "recipes": []
            }
            
        # Get ingredients for each recipe
        for recipe in recipes:
            try:
                ingredient_query = """
                    SELECT ingredient_name as name, amount, 
                           calories_per_gram as calories,
                           carbs_per_gram as carbs,
                           protein_per_gram as protein,
                           fats_per_gram as fats
                    FROM recipe_ingredients
                    WHERE recipe_id = %s
                """
                logger.debug(f"Fetching ingredients for recipe_id: {recipe['id']}")
                cursor.execute(ingredient_query, (recipe['id'],))
                ingredients = cursor.fetchall()
                recipe['ingredients'] = ingredients if ingredients else []
                
            except Exception as e:
                logger.error(f"Error fetching ingredients for recipe {recipe['id']}: {str(e)}")
                recipe['ingredients'] = []  # Set empty ingredients on error
        
        logger.debug(f"Successfully fetched {len(recipes)} recipes with ingredients")
        return {
            "success": True,
            "recipes": recipes
        }
        
    except Exception as e:
        logger.error(f"Error in get_user_recipes: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "recipes": []
        }
    finally:
        if conn:
            conn.close()
            logger.debug("Database connection closed")

@app.delete('/api/user-recipes/{user_id}/{recipe_id}')
async def delete_user_recipe(user_id: int, recipe_id: int):
    conn = None
    try:
        logger.info(f"Starting delete operation for user_id: {user_id}, recipe_id: {recipe_id}")
        conn = get_db_connection()
        cursor = conn.cursor()

        # Start transaction
        conn.start_transaction()

        try:
            # Delete ingredients first
            cursor.execute("""
                DELETE FROM recipe_ingredients
                WHERE recipe_id = %s
            """, (recipe_id,))
            
            ingredients_deleted = cursor.rowcount
            logger.info(f"Deleted {ingredients_deleted} ingredients")

            # Then delete recipe
            cursor.execute("""
                DELETE FROM user_recipes
                WHERE id = %s AND user_id = %s
            """, (recipe_id, user_id))
            
            if cursor.rowcount == 0:
                conn.rollback()
                raise HTTPException(status_code=404, detail="Recipe not found")

            # Commit if everything succeeded
            conn.commit()
            logger.info("Delete operation successful")
            
            return {
                "success": True,
                "message": "Recipe and ingredients deleted successfully"
            }

        except Exception as e:
            conn.rollback()
            logger.error(f"Error during delete: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    except Exception as e:
        logger.error(f"Error in delete_user_recipe: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            try:
                conn.close()
                logger.info("Database connection closed")
            except Exception as e:
                logger.error(f"Error closing connection: {str(e)}")

@app.post("/process-ingredient-name")
async def process_ingredient_name(
    ingredient_name: str = Form(...),
    accept_language: Optional[str] = Header(None)
):
    try:
        # Add request to queue
        await openai_request_queue.put("request")
        
        try:
            language = get_language(accept_language)
            
            # First API call to classify if food is raw
            classification_prompt = f"Is '{ingredient_name}' a raw food ingredient? Please respond with only 'raw' or 'not raw'."
            
            classification_response = await asyncio.to_thread(
                lambda: client.chat.completions.create(
                    model="gpt-4",
                    messages=[
                        {
                            "role": "system",
                            "content": "You are a food classification assistant. Be precise and respond only with 'raw' or 'not raw'."
                        },
                        {
                            "role": "user",
                            "content": classification_prompt
                        }
                    ],
                    max_tokens=10
                )
            )
            
            is_raw = classification_response.choices[0].message.content.strip().lower() == "raw"
            
            if not is_raw:
                return JSONResponse(
                    content={
                        "success": False,
                        "message": "notraw"  # Return 'notraw' keyword
                    },
                    status_code=400 
                )
            
            # If raw, get nutritional values
            nutrition_prompt = f"What are the nutritional values per gram for raw {ingredient_name}? Please respond in exactly this format: calories/g,carbs/g,protein/g,fat/g. For example: 3.2,0.5,0.3,0.1"
            
            nutrition_response = await asyncio.to_thread(
                lambda: client.chat.completions.create(
                    model="gpt-4",
                    messages=[
                        {
                            "role": "system",
                            "content": "You are a nutrition expert. Provide precise nutritional values per gram."
                        },
                        {
                            "role": "user",
                            "content": nutrition_prompt
                        }
                    ],
                    max_tokens=50
                )
            )
            
            nutrition_values = nutrition_response.choices[0].message.content.strip().split(',')
            
            return JSONResponse(
                content={
                    "success": True,
                    "data": {
                        "calories": float(nutrition_values[0]),
                        "carbs": float(nutrition_values[1]),
                        "protein": float(nutrition_values[2]),
                        "fat": float(nutrition_values[3])
                    }
                }
            )
            
        finally:
            # Remove request from queue
            openai_request_queue.get_nowait()
            
    except Exception as e:
        logger.error(f"Error processing ingredient: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


class DailyHealthScore(Base):
    __tablename__ = "daily_health_scores"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    date = Column(DateTime)  # Store full date
    calories_score = Column(Float)
    protein_score = Column(Float)
    carbs_score = Column(Float)
    fats_score = Column(Float)
    final_score = Column(Float)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

@app.post("/daily-health-scores/{user_id}")
async def save_daily_score(
    user_id: int,
    date: str,
    calories_score: float,
    protein_score: float,
    carbs_score: float,
    fats_score: float,
    final_score: float
):
    db = SessionLocal()
    try:
        parsed_date = datetime.strptime(date, '%Y-%m-%d')
        # Check if score exists for this date
        existing_score = db.query(DailyHealthScore).filter(
            DailyHealthScore.user_id == user_id,
            DailyHealthScore.date == parsed_date
        ).first()

        if existing_score:
            # Update existing score
            existing_score.calories_score = calories_score
            existing_score.protein_score = protein_score
            existing_score.carbs_score = carbs_score
            existing_score.fats_score = fats_score
            existing_score.final_score = final_score
        else:
            # Create new score
            new_score = DailyHealthScore(
                user_id=user_id,
                date=parsed_date,
                calories_score=calories_score,
                protein_score=protein_score,
                carbs_score=carbs_score,
                fats_score=fats_score,
                final_score=final_score
            )
            db.add(new_score)

        db.commit()
        return {"message": "Health score saved successfully"}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

@app.get("/monthly-health-scores/{user_id}/{year}/{month}")
async def get_monthly_health_scores(user_id: int, year: int, month: int):
    db = SessionLocal()
    try:
        # Get all daily scores for the specified month
        start_date = datetime(year, month + 1, 1)
        end_date = datetime(year, month + 1, 1) + relativedelta(months=1)
        
        scores = db.query(DailyHealthScore).filter(
            DailyHealthScore.user_id == user_id,
            DailyHealthScore.date >= start_date,
            DailyHealthScore.date < end_date
        ).all()

        return {
            "scores": [{
                "date": score.date.strftime('%Y-%m-%d'),
                "calories_score": score.calories_score,
                "protein_score": score.protein_score,
                "carbs_score": score.carbs_score,
                "fats_score": score.fats_score,
                "final_score": score.final_score
            } for score in scores]
        }

    finally:
        db.close()
        db.close()

@app.post("/process-food-text2")
async def process_food_text2(food_name: str = Form(...), accept_language: Optional[str] = Header(None)):
    try:
        await openai_request_queue.put("request")
        
        try:
            language = get_language(accept_language)
            logger.info(f"Processing food text: {food_name} with language: {language}")

            json_schema = {
                "name": "food_ingredient_schema",
                "strict": True,
                "schema": {
                    "type": "object",
                    "required": ["success", "food_name", "ingredients"],
                    "properties": {
                        "success": {
                            "type": "boolean",
                            "description": "Indicates whether the operation was successful."
                        },
                        "food_name": {
                            "type": "string",
                            "description": "The name of the food item."
                        },
                        "ingredients": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "required": ["name", "calories", "carbs", "protein", "fat", "amount"],
                                "properties": {
                                    "fat": {
                                        "type": "number",
                                        "description": "The amount of fat in the ingredient."
                                    },
                                    "name": {
                                        "type": "string",
                                        "description": "The name of the ingredient."
                                    },
                                    "carbs": {
                                        "type": "number",
                                        "description": "The amount of carbohydrates in the ingredient."
                                    },
                                    "amount": {
                                        "type": "number",
                                        "description": "The amount of the ingredient."
                                    },
                                    "protein": {
                                        "type": "number",
                                        "description": "The amount of protein in the ingredient."
                                    },
                                    "calories": {
                                        "type": "number",
                                        "description": "The number of calories in the ingredient."
                                    }
                                },
                                "additionalProperties": False  # Ensure no extra fields
                            }
                        }
                    },
                    "additionalProperties": False  # Ensure no extra fields
                }
            }

            response = await asyncio.to_thread(
                lambda: client.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {
                            "role": "user",
                            "content": f"Provide nutritional information for {food_name} per 100g serving."
                        }
                    ],
                    response_format={
                        "type": "json_schema",
                        "json_schema": json_schema
                    },
                    temperature=0.7,
                    max_tokens=2048
                )
            )
            
            response_content = response.choices[0].message.content.strip()
            logger.info(f"OpenAI response: {response_content}")

            return JSONResponse(content=json.loads(response_content))

        except asyncio.CancelledError:
            logger.error("Request was cancelled")
            raise HTTPException(status_code=499, detail="Request cancelled")
            
        except asyncio.TimeoutError:
            logger.error("OpenAI API request timed out")
            raise HTTPException(
                status_code=504,
                detail=error_messages.get(language, error_messages["en"]) + " (timeout)"
            )

    except Exception as e:
        logger.error(f"Error processing food text: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while processing the food text."
        )
    finally:
        try:
            openai_request_queue.get_nowait()
        except asyncio.QueueEmpty:
            pass

@app.post("/process-food-image2")
async def process_food_image2(request: Request, image: UploadFile = File(...), accept_language: Optional[str] = Header(None)):
    try:
        await openai_request_queue.put("request")
        
        try:
            language = get_language(accept_language)
            logger.info(f"Starting image processing with language: {language}")
            
            contents = await image.read()
            if len(contents) == 0:
                raise HTTPException(status_code=400, detail="Empty file")
            
            base64_image = base64.b64encode(contents).decode('utf-8')
            
            json_schema = {
                "name": "food_ingredient_schema",
                "strict": True,
                "schema": {
                    "type": "object",
                    "required": ["success", "food_name", "ingredients"],
                    "properties": {
                        "success": {
                            "type": "boolean",
                            "description": "Indicates whether the operation was successful."
                        },
                        "food_name": {
                            "type": "string",
                            "description": "The name of the food item."
                        },
                        "ingredients": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "required": ["name", "calories", "carbs", "protein", "fat", "amount"],
                                "properties": {
                                    "fat": {
                                        "type": "number",
                                        "description": "The amount of fat in the ingredient."
                                    },
                                    "name": {
                                        "type": "string",
                                        "description": "The name of the ingredient."
                                    },
                                    "carbs": {
                                        "type": "number",
                                        "description": "The amount of carbohydrates in the ingredient."
                                    },
                                    "amount": {
                                        "type": "number",
                                        "description": "The amount of the ingredient."
                                    },
                                    "protein": {
                                        "type": "number",
                                        "description": "The amount of protein in the ingredient."
                                    },
                                    "calories": {
                                        "type": "number",
                                        "description": "The number of calories in the ingredient."
                                    }
                                },
                                "additionalProperties": False
                            }
                        }
                    },
                    "additionalProperties": False
                }
            }

            response = await asyncio.to_thread(
                lambda: client.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "text",
                                    "text": "Analyze the food in the image and provide nutritional information per 100g serving."
                                },
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:image/jpeg;base64,{base64_image}"
                                    }
                                }
                            ]
                        }
                    ],
                    response_format={
                        "type": "json_schema",
                        "json_schema": json_schema
                    },
                    temperature=0.7,
                    max_tokens=2048
                )
            )
            
            response_content = response.choices[0].message.content.strip()
            logger.info(f"OpenAI response: {response_content}")

            return JSONResponse(content=json.loads(response_content))

        except asyncio.CancelledError:
            logger.error("Request was cancelled")
            raise HTTPException(status_code=499, detail="Request cancelled")
            
        except asyncio.TimeoutError:
            logger.error("OpenAI API request timed out")
            raise HTTPException(
                status_code=504,
                detail=error_messages.get(language, error_messages["en"]) + " (timeout)"
            )

    except Exception as e:
        logger.error(f"Error processing food image: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while processing the food image."
        )
    finally:
        try:
            openai_request_queue.get_nowait()
        except asyncio.QueueEmpty:
            pass

@app.options("/api/user-recipes/{user_id}/{recipe_id}")
async def options_delete_recipe():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )