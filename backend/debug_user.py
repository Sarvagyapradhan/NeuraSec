from app.database.database import SessionLocal
from app.database.models import User
from app.core.security import verify_password, get_password_hash

def debug_user():
    """Debug the test user in the database"""
    db = SessionLocal()
    
    try:
        # Check if test user exists
        user = db.query(User).filter(User.email == "test@example.com").first()
        
        if not user:
            print("❌ Test user not found in database!")
            
            # Create test user
            print("Creating test user...")
            password = "password123"
            hashed_password = get_password_hash(password)
            
            new_user = User(
                email="test@example.com",
                password=hashed_password,
                full_name="Test User",
                role="user"
            )
            
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            
            print(f"✅ Created test user with ID: {new_user.id}")
            user = new_user
        else:
            print(f"✅ Found test user with ID: {user.id}")
            print(f"Email: {user.email}")
            print(f"Full Name: {user.full_name}")
            print(f"Role: {user.role}")
        
        # Check password
        print("\nTesting password authentication...")
        
        correct_password = "password123"
        wrong_password = "wrongpassword"
        
        is_correct = verify_password(correct_password, user.password)
        is_wrong = verify_password(wrong_password, user.password)
        
        print(f"Correct password authentication: {'✅ Success' if is_correct else '❌ Failed'}")
        print(f"Wrong password authentication: {'❌ Failed (Good)' if not is_wrong else '⚠️ Success (Bad)'}")
        
        if not is_correct:
            print("\n⚠️ Updating password hash...")
            new_hash = get_password_hash(correct_password)
            user.password = new_hash
            db.commit()
            
            # Verify again
            is_fixed = verify_password(correct_password, user.password)
            print(f"Password fix result: {'✅ Success' if is_fixed else '❌ Failed'}")
            
        print("\n✅ User debugging complete!")
        
    except Exception as e:
        print(f"❌ Error during user debugging: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    debug_user() 