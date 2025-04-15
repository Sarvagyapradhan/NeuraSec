from app.database.database import engine, Base, SessionLocal
from app.database.models import User, OTP
from app.core.security import verify_password, generate_otp, create_access_token
import sys

def test_login():
    # Create a session
    db = SessionLocal()
    
    try:
        # Simulate login process
        print("Testing login with test@example.com / password123")
        
        # Find the user
        user = db.query(User).filter(User.email == "test@example.com").first()
        
        if not user:
            print("❌ User not found")
            return
        
        print(f"✅ Found user: {user.email} (ID: {user.id})")
        
        # Verify password
        password = "password123"
        is_password_valid = verify_password(password, user.password)
        
        if not is_password_valid:
            print("❌ Password verification failed")
            return
        
        print("✅ Password verification successful")
        
        # Generate OTP (simulating login process)
        otp_code = generate_otp()
        print(f"✅ Generated OTP: {otp_code}")
        
        # Create OTP in database
        db_otp = OTP(
            email=user.email,
            otp=otp_code,
            user_id=user.id,
            expiry=OTP.create_expiry()
        )
        db.add(db_otp)
        db.commit()
        db.refresh(db_otp)
        
        print(f"✅ Saved OTP to database with expiry: {db_otp.expiry}")
        
        # Simulate OTP verification
        print(f"Simulating OTP verification with code: {otp_code}")
        
        # Find the OTP
        db_otp = db.query(OTP).filter(
            OTP.email == user.email,
            OTP.otp == otp_code,
            OTP.used == False
        ).order_by(OTP.created_at.desc()).first()
        
        if not db_otp:
            print("❌ OTP not found")
            return
        
        print("✅ OTP verification successful")
        
        # Mark OTP as used
        db_otp.used = True
        db.add(db_otp)
        db.commit()
        
        # Create access token
        access_token = create_access_token(
            data={"sub": user.email, "user_id": user.id, "role": user.role}
        )
        
        print(f"✅ Generated access token: {access_token[:20]}...")
        print("\nAuthentication flow completed successfully!")
        
    except Exception as e:
        print(f"❌ Error during test: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_login() 