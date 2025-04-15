import os
import sys
from getpass import getpass

# Add the project root to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.database import SessionLocal
from app.database.models import User
from app.core.security import verify_password, get_password_hash

def main():
    print("🔍 NeuraSec User Check Utility")
    print("-" * 50)
    
    # Check specific user by email
    specific_email = "sarvagyapradhan823@gmail.com"
    check_user(specific_email)
    
def check_user(email):
    db = SessionLocal()
    try:
        # Try to find the user
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            print(f"❌ User not found: {email}")
            print("\nOptions:")
            print("1. Check if you're connecting to the correct database")
            print("2. Verify the email spelling is correct")
            print("3. The user might need to be created first")
            return
        
        print(f"✅ User found: {user.email} (ID: {user.id})")
        print(f"Role: {getattr(user, 'role', 'unknown')}")
        
        # Print attributes safely
        for attr in ['full_name', 'username', 'last_login', 'created_at']:
            if hasattr(user, attr):
                print(f"{attr}: {getattr(user, attr)}")
        
        # Print password hash (partially)
        password_hash = user.password
        print(f"Password hash: {password_hash[:10]}...{password_hash[-10:]}")
        
        # Ask if you want to test password
        test_password = input("\nDo you want to test the password? (y/n): ")
        if test_password.lower() == 'y':
            password = getpass("Enter password to check: ")
            is_valid = verify_password(password, user.password)
            
            if is_valid:
                print("✅ Password is correct!")
            else:
                print("❌ Password validation failed!")
                
                # Offer to update password
                update_pw = input("\nDo you want to update the password? (y/n): ")
                if update_pw.lower() == 'y':
                    new_password = getpass("Enter new password: ")
                    confirm_password = getpass("Confirm new password: ")
                    
                    if new_password == confirm_password:
                        # Update password
                        user.password = get_password_hash(new_password)
                        db.add(user)
                        db.commit()
                        print("✅ Password updated successfully!")
                    else:
                        print("❌ Passwords don't match!")
    
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    main() 