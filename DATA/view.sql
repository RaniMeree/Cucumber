-- 1. Basic user information view (excluding sensitive data like password)
CREATE VIEW vw_user_info AS
SELECT 
    id,
    username,
    email,
    role,
    age,
    weight,
    height,
    gender,
    activity,
    goal,
    bmi,
    requiredCalories,
    is_verified,
    created
FROM users;

-- 2. User health metrics view
CREATE VIEW vw_user_health AS
SELECT 
    id,
    username,
    weight,
    height,
    bmi,
    requiredCalories,
    activity,
    goal
FROM users;

-- 3. User activity status view
CREATE VIEW vw_user_activity AS
SELECT 
    id,
    username,
    activity,
    goal,
    is_verified,
    created,
    CASE 
        WHEN is_verified = 1 THEN 'Verified'
        ELSE 'Not Verified'
    END AS verification_status
FROM users;

-- 4. User nutritional requirements view
CREATE VIEW vw_user_nutrition AS
SELECT 
    id,
    username,
    weight,
    requiredCalories,
    CASE 
        WHEN goal = 'lose weight' THEN requiredCalories - 500
        WHEN goal = 'gain weight' THEN requiredCalories + 500
        ELSE requiredCalories
    END AS adjusted_calories
FROM users;