from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import os
import requests
from dotenv import load_dotenv

from app.database.database import get_db
from app.database.models import User
from app.schemas.auth import Token, GoogleAuthRequest
from app.core.security import create_access_token

# Load environment variables
load_dotenv()

# Google OAuth2 config
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:3000/api/auth/google/callback")

router = APIRouter()

@router.post("/google", response_model=Token)
async def google_auth(
    auth_data: GoogleAuthRequest,
    db: Session = Depends(get_db)
):
    """Handle Google OAuth authentication"""
    try:
        # Exchange authorization code for access token
        token_url = "https://oauth2.googleapis.com/token"
        token_data = {
            "code": auth_data.code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code"
        }
        
        token_response = requests.post(token_url, data=token_data)
        token_response.raise_for_status()
        token_json = token_response.json()
        
        # Get user info with the access token
        user_info_url = "https://www.googleapis.com/oauth2/v2/userinfo"
        headers = {"Authorization": f"Bearer {token_json['access_token']}"}
        
        user_info_response = requests.get(user_info_url, headers=headers)
        user_info_response.raise_for_status()
        user_info = user_info_response.json()
        
        # Extract user data
        google_id = user_info["id"]
        email = user_info["email"]
        name = user_info.get("name", "")
        picture = user_info.get("picture", "")
        
        # Check if user exists
        user = db.query(User).filter(User.google_id == google_id).first()
        
        if not user:
            # Check if email exists
            email_user = db.query(User).filter(User.email == email).first()
            
            if email_user:
                # Link Google ID to existing user
                email_user.google_id = google_id
                email_user.profile_picture = picture if not email_user.profile_picture else email_user.profile_picture
                db.add(email_user)
                db.commit()
                db.refresh(email_user)
                user = email_user
            else:
                # Create new user
                user = User(
                    email=email,
                    full_name=name,
                    profile_picture=picture,
                    google_id=google_id,
                    # No password for Google users
                )
                db.add(user)
                db.commit()
                db.refresh(user)
        
        # Create JWT token
        access_token = create_access_token(
            data={"sub": user.email, "user_id": user.id, "role": user.role}
        )
        
        return {"access_token": access_token, "token_type": "bearer"}
        
    except requests.RequestException as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Google authentication failed: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error during Google authentication: {str(e)}"
        ) 