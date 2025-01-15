import os
from dotenv import load_dotenv

load_dotenv()

# Email settings
EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp-mail.outlook.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "your-email@example.com")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "your-password")
EMAIL_USE_TLS = True
EMAIL_USE_SSL = False
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000") 