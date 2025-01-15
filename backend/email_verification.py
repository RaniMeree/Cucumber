import smtplib
from email.mime.text import MIMEText
import logging
import random
import string
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

# Setup logging
logger = logging.getLogger(__name__)

# Setup router
router = APIRouter()

# Store verification codes temporarily
verification_codes = {}

# Import User model and SessionLocal from main
def get_db_from_main():
    from main import SessionLocal, User  # Import both SessionLocal and User
    global User  # Make User available globally in this module
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def generate_verification_code():
    """Generate a simple 6-digit verification code"""
    return ''.join(random.choices(string.digits, k=6))

def send_verification_code(email: str, code: str):
    # Gmail SMTP settings
    smtp_host = 'smtp.gmail.com'
    smtp_port = 587
    smtp_user = 'ranimeree@gmail.com'
    smtp_pass = 'lkhw nfnt uehr iaji'

    # Create email message
    email_body = f"""
    Hello,
    
    Thank you for registering with CucumerCal. Your verification code is:
    
    {code}
    
    Please enter this code in the application to verify your email address.
    
    If you did not request this code, please ignore this email.
    
    Best regards,
    CucumerCal Team
    """

    msg = MIMEText(email_body)
    msg['Subject'] = 'CucumerCal - Your Verification Code'
    msg['From'] = smtp_user
    msg['To'] = email

    try:
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
            logger.info(f"Verification code sent to {email}")
            return True
    except Exception as e:
        logger.error(f"Failed to send verification code to {email}: {e}")
        return False

class VerificationRequest(BaseModel):
    email: str
    code: str

class VerificationResponse(BaseModel):
    message: str
    success: bool = True

@router.post("/verify-code", response_model=VerificationResponse)
async def verify_code_endpoint(request: VerificationRequest, db: Session = Depends(get_db_from_main)):
    print("\n=== Verification Attempt Details ===")
    print(f"Email attempting verification: {request.email}")
    print(f"Code received from user: {request.code}")
    print(f"All stored verification codes: {verification_codes}")
    
    if request.email not in verification_codes:
        print(f"❌ ERROR: No verification code found for email: {request.email}")
        raise HTTPException(status_code=400, detail="No verification code found for this email")
    
    stored_data = verification_codes[request.email]
    print(f"Stored data for this email: {stored_data}")
    print(f"Stored code: {stored_data['code']}")
    print(f"Comparing received code '{request.code}' with stored code '{stored_data['code']}'")
    print(f"Types - Received: {type(request.code)}, Stored: {type(stored_data['code'])}")
    
    if stored_data["code"] == request.code:
        print("✅ Verification code matches!")
        try:
            from main import User  # Import User here to ensure it's available
            user = db.query(User).filter(User.email == request.email).first()
            if user:
                user.is_verified = True
                db.commit()
                del verification_codes[request.email]
                return VerificationResponse(message="Email verified successfully")
            else:
                print("❌ ERROR: User not found in database")
                raise HTTPException(status_code=404, detail="User not found")
        except Exception as e:
            db.rollback()
            print(f"❌ ERROR during database operation: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
    else:
        print("❌ ERROR: Verification code mismatch!")
        print(f"Expected: '{stored_data['code']}', Received: '{request.code}'")
        raise HTTPException(status_code=400, detail="Verification code is not correct")

@router.post("/resend-verification", response_model=VerificationResponse)
async def resend_verification(email: str, db: Session = Depends(get_db_from_main)):
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        if user.is_verified:
            raise HTTPException(status_code=400, detail="Email already verified")
            
        code = generate_verification_code()
        verification_codes[email] = {
            "code": code,
            "user_data": {
                "id": user.id,
                "email": user.email,
                "username": user.username
            }
        }
        
        if send_verification_code(email, code):
            return VerificationResponse(message="Verification code resent successfully")
        else:
            raise HTTPException(status_code=500, detail="Failed to send verification code")
            
    except Exception as e:
        logger.error(f"Error resending verification: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-verification")
async def generate_verification_endpoint(email: str, db: Session = Depends(get_db_from_main)):
    print("\n=== Generating New Verification Code ===")
    print(f"Generating code for email: {email}")
    
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"❌ ERROR: User not found for email: {email}")
            raise HTTPException(status_code=404, detail="User not found")
            
        code = generate_verification_code()
        print(f"Generated code: {code}")
        
        verification_codes[email] = {
            "code": code,
            "user_data": {
                "id": user.id,
                "email": user.email,
                "username": user.username
            }
        }
        print(f"Stored verification data: {verification_codes[email]}")
        
        if send_verification_code(email, code):
            print("✅ Verification code sent successfully")
            return {"message": "Verification code sent successfully"}
        else:
            print("❌ ERROR: Failed to send verification code")
            raise HTTPException(status_code=500, detail="Failed to send verification code")
            
    except Exception as e:
        print(f"❌ ERROR during verification generation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 