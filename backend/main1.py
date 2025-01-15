from fastapi import FastAPI, HTTPException, UploadFile, File, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
import sqlite3
from fastapi.middleware.cors import CORSMiddleware
import logging
from sqlalchemy import create_engine, Column, Integer, String, Float
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
import torch
from torchvision import transforms
from transformers import CLIPProcessor, CLIPModel
from transformers import BlipProcessor, BlipForConditionalGeneration


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
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

origins = [
    "http://localhost:3000",  # Adjust this to your frontend's origin
    "http://localhost:800",
]
# CORS middleware to allow requests from your frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define the database path
DATABASE_PATH = r"E:\STUDY\MDU\DVA309 - Examensarbete\ReactApp\calorie-estimation-app\storeDB.db"
DATABASE_URL = "sqlite:///E:/STUDY/MDU/DVA309 - Examensarbete/ReactApp/calorie-estimation-app/storeDB.db"
 # Adjust the path as needed

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False, "timeout": 30},
    poolclass=StaticPool
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
    weight = Column(Float)
    height = Column(Float)  # Ensure this is defined if needed for signup
    age = Column(Integer)
    gender = Column(String)
    activity = Column(String)
    goal = Column(String)
    requiredCalories = Column(Float)

Base.metadata.create_all(bind=engine)
class Food(Base):   
    __tablename__ = "foods"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    calories = Column(Float)  # Add calories column

SAVE_DIRECTORY = r"E:/STUDY/MDU/DVA309 - Examensarbete/ReactApp/calorie-estimation-app/images"

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
# Pydantic model for user login
class UserLogin(BaseModel):
    email: str
    password: str

# Function to connect to the SQLite database
def get_db_connection():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row  # This allows us to access columns by name
    return conn

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
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    db = SessionLocal()
    try:
        # Use the renamed function
        user = get_user_by_email(db, form_data.username)
        if not user or not verify_password(form_data.password, user.password):
            raise HTTPException(
                status_code=400,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email, "username": user.username, "user_id": user.id, "requiredCalories": user.requiredCalories}, 
            expires_delta=access_token_expires
        )
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_id": user.id,
            "username": user.username,
            "requiredCalories": user.requiredCalories
        }
    finally:
        db.close()

@app.post("/signup")
async def signup(user: UserRegistration):
    allowed_activities = ['No Exercise', 'Once a week', '2-3 time per week', '4-5 times a week']
    conn = sqlite3.connect(r"E:/STUDY\MDU\DVA309 - Examensarbete/ReactApp/calorie-estimation-app/storeDB.db")
    cursor = conn.cursor()
    
    # Check if email is already registered
    cursor.execute("SELECT * FROM users WHERE email=?", (user.email,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Email already registered")

    # Insert the user data into the database
    hashed_password = hash_password(user.password)
    query = """
    INSERT INTO users (username, password, role, email, token, created, age, weight, height, gender, activity, goal, bmi, requiredCalories)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """
    
    # Set the current date for 'created' field
    created_date = date.today()
    
    # Prepare parameters, you can set default values for bmi and requiredCalories if not provided
    params = (
        user.username,
        hashed_password,
        "user",  # Ensure this is part of UserCreate
        user.email,
        None,  # Set token as None or however you handle it
        created_date,
        user.age,
        user.weight,
        user.height,
        user.gender,
        user.activity,
        user.goal,
        None,  # Set bmi to None or calculate it if needed
        user.requiredCalories   # Set requiredCalories to None or calculate it if needed
    )

    # Execute the query
    cursor.execute(query, params)  # Ensure params count matches the number of placeholders
    conn.commit()
    conn.close()

    return {"success": True, "message": "User created successfully"}



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
    count: float = Form(...),
    food_calories: float = Form(...),
    date: str = Form(...),

):
    print("Received submission:")
    print(f"user_id: {user_id}")
    print(f"foods_id: {foods_id}")
    print(f"count: {count}")
    print(f"food_calories: {food_calories}")
    print(f"date: {date}")
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()



        # Insert the intake data into the table
        cursor.execute("""
            INSERT INTO intake (user_id, foods_id, count, food_calories, date)
            VALUES (?, ?, ?, ?, ?)
        """, (user_id, foods_id, count, food_calories, date))
        
        conn.commit()
        conn.close()

        return {"message": "Intake data submitted successfully."}

    except Exception as e:
        return {"error": str(e)}
    

@app.post("/upload_image/")
async def upload_image(image: UploadFile = File(...)):
    file_location = os.path.join(SAVE_DIRECTORY, "captured_image.png")
    with open(file_location, "wb") as file:
        file.write(await image.read())  # Save image

    return {"message": "Image uploaded successfully."}

@app.get("/intake/{user_id}")
async def get_user_intake(user_id: int):
    logger.info(f"Received request for user intake with user_id: {user_id}")
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Modified query to join with foods table and get food name
        cursor.execute("""
            SELECT intake.*, foods.name as food_name 
            FROM intake 
            LEFT JOIN foods ON intake.foods_id = foods.id 
            WHERE user_id = ?
        """, (user_id,))
        rows = cursor.fetchall()

        logger.info(f"Fetched {len(rows)} rows for user_id: {user_id}")

        if not rows:
            logger.warning(f"No intake data found for user_id: {user_id}")

        return {"intake": [dict(row) for row in rows]}
    except Exception as e:
        logger.error(f"Error fetching intake data for user_id {user_id}: {str(e)}")
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
async def update_user(
    user_id: int, 
    user_data: UserUpdate,
    db: Session = Depends(get_db)
):
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user.weight = user_data.weight
        user.activity = user_data.activity
        user.goal = user_data.goal

        user.requiredCalories = calculate_required_calories(
            float(user.weight), int(user.age), user.gender, user.activity, user.goal
        )

        db.commit()
        return {"message": "User information updated successfully", "requiredCalories": user.requiredCalories}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

def calculate_required_calories(weight, age, gender, activity, goal):
    BMR = (10 * weight - 5 * age + (5 if gender == 'Male' else -161))
    activity_levels = {
        'No Exercise': 1.2,
        'Once a week': 1.4,
        '2-3 times per week': 1.6,
        '4-5 times per week': 1.8,
    }
    activity_factor = activity_levels.get(activity, 1)
    daily_calories = BMR * activity_factor

    if goal == 'lose weight':
        daily_calories *= 0.8
    elif goal == 'gain weight':
        daily_calories += 500

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

# Initialize CLIP model and processor
model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

def process_image_with_clip(image_path):
    # Load and preprocess the image
    image = Image.open(image_path)
    
    # Get all food names from database for comparison
    db = SessionLocal()
    foods = db.query(Food.name).all()
    food_names = [food[0] for food in foods]
    db.close()
    
    # Prepare inputs for CLIP
    inputs = processor(
        images=image,
        text=food_names,
        return_tensors="pt",
        padding=True
    )
    
    # Get prediction
    outputs = model(**inputs)
    logits_per_image = outputs.logits_per_image
    probs = logits_per_image.softmax(dim=1)
    
    # Get the most likely food
    max_prob_idx = probs[0].argmax().item()
    predicted_food = food_names[max_prob_idx]
    confidence = probs[0][max_prob_idx].item()
    
    return predicted_food, confidence

# Define your access token directly (for development purposes only)
access_token = "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"

@app.post("/process-food-image")
async def process_food_image(image: UploadFile = File(...)):
    try:
        # Save the uploaded image
        file_path = os.path.join(SAVE_DIRECTORY, image.filename)
        print(f"Saving image to: {file_path}")  # Debug statement
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        
        # Use BLIP API to process the image
        processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base", use_auth_token=access_token)
        model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base", use_auth_token=access_token)

        # Load the image using PIL
        image = Image.open(file_path)  # Load the image as a PIL Image
        print("Image loaded successfully.")  # Debug statement

        # Preprocess the image
        image_tensor = processor(images=image, return_tensors="pt").pixel_values
        print("Image processed for model input.")  # Debug statement

        # Generate caption
        output = model.generate(image_tensor)
        predicted_food = processor.decode(output[0], skip_special_tokens=True)
        print(f"Predicted food: {predicted_food}")  # Debug statement

        # Get food details from database
        db = SessionLocal()
        
        # Fetch all food names from the database for comparison
        food_names = [food.name.lower() for food in db.query(Food).all()]  # Get all food names in lowercase
        db.close()

        # Extract relevant food name from the predicted description
        predicted_food = predicted_food.lower()
        relevant_food_name = None

        # Check for food names in the database
        for food_name in food_names:
            if food_name in predicted_food:  # Check if food_name is part of predicted_food
                relevant_food_name = food_name
                break

        if relevant_food_name:
            # Fetch the food details from the database
            db = SessionLocal()
            food = db.query(Food).filter(Food.name.ilike(f"%{relevant_food_name}%")).first()  # Use ilike for case-insensitive search
            db.close()

            if food:
                print(f"Food found in database: {food.name}")  # Debug statement
                return {
                    "success": True,
                    "food_name": food.name,
                    "food_id": food.id, 
                    "calories": food.calories,
                    "confidence": 1.0  # Confidence can be set to 1.0 as BLIP provides a caption
                }
        else:
            print("Food not found in database.")  # Debug statement
            return {
                "success": False,
                "message": "Food not found in database"
            }
            
    except Exception as e:
        print(f"Error occurred: {str(e)}")  # Debug statement
        return {"success": False, "error": str(e)}

def get_food_id_by_name(food_name: str, db_connection):
    cursor = db_connection.cursor()
    cursor.execute("SELECT id FROM foods WHERE name = ?", (food_name,))
    result = cursor.fetchone()
    return result[0] if result else None
    return result[0] if result else None