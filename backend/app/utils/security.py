from typing import Optional
from sqlalchemy.orm import Session
from backend.models import User

def authenticate_user(db: Session, username_or_email: str, password: str) -> Optional[User]:
    """
    Authenticate a user with email/username and password
    """
    # Check if input is an email
    if '@' in username_or_email:
        user = db.query(User).filter(User.email == username_or_email).first()
    else:
        user = db.query(User).filter(User.username == username_or_email).first()
        
    if not user:
        return None
    if not verify_password(password, user.password):
        return None
    return user 