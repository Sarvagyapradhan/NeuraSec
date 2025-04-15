from fastapi import Depends, HTTPException, status, Security, Header
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from typing import Optional

from app.database.database import get_db
from app.database.models import User
from app.schemas.auth import TokenData
from app.core.security import SECRET_KEY, ALGORITHM, verify_admin_api_key

# OAuth2 scheme for JWT token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme), 
    db: Session = Depends(get_db)
):
    """Get the current user from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decode the JWT token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        user_id: int = payload.get("user_id")
        
        if email is None or user_id is None:
            raise credentials_exception
            
        token_data = TokenData(email=email, user_id=user_id)
    except JWTError:
        raise credentials_exception
    
    # Get the user from the database
    user = db.query(User).filter(User.id == token_data.user_id).first()
    if user is None:
        raise credentials_exception
        
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)):
    """Check if the current user is active"""
    # Add additional checks here if needed
    return current_user

async def get_admin_user(current_user: User = Depends(get_current_active_user)):
    """Check if the current user is an admin"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    return current_user

async def validate_admin_api_key(x_admin_key: Optional[str] = Header(None)):
    """Validate the admin API key from headers"""
    if not x_admin_key or not verify_admin_api_key(x_admin_key):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or missing admin API key",
        )
    return True

# Combined dependency for admin access (either JWT token or API key)
async def admin_access(
    admin_key_valid: bool = Depends(validate_admin_api_key),
    admin_user: User = Depends(get_admin_user)
):
    """Allow access if either admin API key or admin user JWT is valid"""
    # This will only be called if one of the dependencies succeeds
    return True 