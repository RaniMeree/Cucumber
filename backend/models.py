from sqlalchemy import Boolean, Column, ForeignKey, Integer, String ,Date,DateTime,Float
from sqlalchemy.orm import relationship
from engin import Base
from datetime import date

class Users(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(255),unique=False)
    password =  Column(String(255),unique=False)
    role =  Column(String(255),nullable=False)
    email =  Column(String(255),unique=True)
    token = Column(String(255),unique=False)
    created =  Column(Date, default=date.today)
    age = Column(Integer,nullable=False)
    weight = Column(Float,nullable=False)
    height = Column(Float,nullable=False)
    gender = Column(String,nullable=False)
    activity = Column(String,nullable=False)
    goal = Column(String,nullable=False)
    requiredCalories = Column(Float, nullable=True)
    intake = relationship("Intake", back_populates="user")

class Foods(Base):
    __tablename__ = "foods"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255),unique=False)
    calories =  Column(Float,nullable=True)
    
    intake = relationship("Intake", back_populates="food")

class Intake(Base):
    __tablename__ = "intake"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id", ondelete='CASCADE'), nullable=False)
    user = relationship("Users", back_populates="intake")

    foods_id = Column(Integer, ForeignKey("foods.id", ondelete='CASCADE'), nullable=False)
    food = relationship("Foods", back_populates="intake")

    count = Column(Float,nullable=True)
    date =  Column(Date, default=date.today)

