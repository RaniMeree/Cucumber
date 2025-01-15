-- Start transaction
START TRANSACTION;

-- Create users table first (as it's referenced by other tables)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(255),
    password VARCHAR(255),
    role VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    token VARCHAR(255),
    created TIMESTAMP,
    age VARCHAR(255),
    weight FLOAT,
    height FLOAT,
    gender ENUM('Male', 'Female'),
    activity ENUM('No Exercise', 'Once a week', '2-3 time per week', '4-5 times a week'),
    goal ENUM('maintain weight', 'lose weight', 'gain weight'),
    bmi FLOAT,
    requiredCalories FLOAT,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token TEXT
);

-- Create foods table
CREATE TABLE IF NOT EXISTS foods (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255),
    calories FLOAT
);

-- Create user_recipes table
CREATE TABLE IF NOT EXISTS user_recipes (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    user_id INTEGER NOT NULL,
    recipe_name VARCHAR(255) NOT NULL,
    calories_per_gram FLOAT NOT NULL,
    carbs_per_gram FLOAT NOT NULL,
    protein_per_gram FLOAT NOT NULL,
    fats_per_gram FLOAT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create recipe_ingredients table
CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    recipe_id INTEGER,
    ingredient_name VARCHAR(255) NOT NULL,
    calories_per_gram FLOAT NOT NULL,
    carbs_per_gram FLOAT NOT NULL,
    protein_per_gram FLOAT NOT NULL,
    fats_per_gram FLOAT NOT NULL,
    amount FLOAT NOT NULL,
    FOREIGN KEY (recipe_id) REFERENCES user_recipes(id) ON DELETE CASCADE
);

-- Create user_foods table
CREATE TABLE IF NOT EXISTS user_foods (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    user_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    calories FLOAT NOT NULL,
    carbs FLOAT DEFAULT 0,
    protein FLOAT DEFAULT 0,
    fats FLOAT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, name),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create intake table
CREATE TABLE IF NOT EXISTS intake (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    user_id INTEGER NOT NULL,
    foods_id INTEGER,
    food_name TEXT,
    count FLOAT,
    date DATETIME,
    food_calories FLOAT,
    food_carbs FLOAT DEFAULT 0,
    food_protein FLOAT DEFAULT 0,
    food_fats FLOAT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create daily_health_scores table
CREATE TABLE IF NOT EXISTS daily_health_scores (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    user_id INTEGER NOT NULL,
    score_date DATE NOT NULL,
    calories_percentage DECIMAL(5,2),
    protein_percentage DECIMAL(5,2),
    carbs_percentage DECIMAL(5,2),
    fats_percentage DECIMAL(5,2),
    calories_score DECIMAL(5,2),
    protein_score DECIMAL(5,2),
    carbs_score DECIMAL(5,2),
    fats_score DECIMAL(5,2),
    final_score DECIMAL(4,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (user_id, score_date)
);

-- Create daily_user_stats table
CREATE TABLE IF NOT EXISTS daily_user_stats (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    user_id INTEGER NOT NULL,
    date DATE NOT NULL,
    weight FLOAT,
    age TEXT,
    activity ENUM('No Exercise', 'Once a week', '2-3 time per week', '4-5 times a week'),
    goal ENUM('maintain weight', 'lose weight', 'gain weight'),
    required_calories FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, date)
);

-- Create indexes
CREATE INDEX idx_date ON daily_health_scores(score_date);
CREATE INDEX idx_intake_user_id ON intake(user_id);
CREATE INDEX idx_user_date ON daily_health_scores(user_id, score_date);
CREATE INDEX ix_foods_id ON foods(id);
CREATE INDEX ix_users_id ON users(id);

COMMIT;