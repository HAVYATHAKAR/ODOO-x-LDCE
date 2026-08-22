from pydantic import BaseModel, EmailStr
from typing import Optional

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    username: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    username: str
    first_name: str
    last_name: str

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse
