from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
import os

# MySQL connection URL
SQLALCHEMY_DATABASE_URL = "mysql://root:123456@localhost/storedb?auth_plugin=mysql_native_password"

# Create engine with MySQL configuration
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_size=20,  # Adjust based on your needs
    pool_recycle=3600,  # Recycle connections after 1 hour
    echo=True  # Set to False in production
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for declarative models
Base = declarative_base()

# Function to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

