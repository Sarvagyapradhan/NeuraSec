import sys
import os

# Add the parent directory to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database.database import SessionLocal, engine, Base
from app.database.models import User, UserRole
from app.core.security import get_password_hash

def create_admin_user(email: str, password: str, full_name: str = "Admin User"):
    """Create an admin user if it doesn't already exist"""
    db = SessionLocal()
    try:
        # Check if admin exists
        user = db.query(User).filter(User.email == email).first()
        
        if user:
            print(f"Admin user with email {email} already exists.")
            return
        
        # Create new admin user
        hashed_password = get_password_hash(password)
        new_admin = User(
            email=email,
            password=hashed_password,
            full_name=full_name,
            role=UserRole.ADMIN.value
        )
        
        db.add(new_admin)
        db.commit()
        db.refresh(new_admin)
        
        print(f"Admin user created successfully with email: {email}")
    
    except Exception as e:
        print(f"Error creating admin user: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    # Ensure database tables exist
    Base.metadata.create_all(bind=engine)
    
    if len(sys.argv) < 3:
        print("Usage: python -m app.create_admin <email> <password> [full_name]")
        sys.exit(1)
    
    email = sys.argv[1]
    password = sys.argv[2]
    full_name = sys.argv[3] if len(sys.argv) > 3 else "Admin User"
    
    create_admin_user(email, password, full_name) 