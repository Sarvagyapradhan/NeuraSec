from app.database.database import engine, Base, SessionLocal
from app.database.models import User
from app.core.security import get_password_hash, verify_password
import sys

def create_test_user():
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    # Create a session
    db = SessionLocal()
    
    try:
        # Check if test user already exists
        existing_user = db.query(User).filter(User.email == "test@example.com").first()
        
        if existing_user:
            print(f"Test user already exists with email: test@example.com")
            
            # Update password to make sure it's correctly hashed
            password = "password123"
            hashed_password = get_password_hash(password)
            existing_user.password = hashed_password
            db.commit()
            db.refresh(existing_user)
            
            # Verify the password works
            verification = verify_password(password, existing_user.password)
            print(f"Password verification test: {'SUCCESS' if verification else 'FAILED'}")
            print(f"User ID: {existing_user.id}")
            print(f"User email: {existing_user.email}")
            print(f"User role: {existing_user.role}")
            
            return
        
        # Create test user
        password = "password123"
        hashed_password = get_password_hash(password)
        print(f"Hashed password: {hashed_password}")
        
        test_user = User(
            email="test@example.com",
            password=hashed_password,
            full_name="Test User",
            role="user"
        )
        
        # Add to database
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
        
        # Verify the password works
        verification = verify_password(password, test_user.password)
        print(f"Test user created successfully with email: test@example.com")
        print(f"Password verification test: {'SUCCESS' if verification else 'FAILED'}")
        print(f"User ID: {test_user.id}")
        print(f"User email: {test_user.email}")
        print(f"User role: {test_user.role}")
    except Exception as e:
        db.rollback()
        print(f"Error creating test user: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_test_user() 