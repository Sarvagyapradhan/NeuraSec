import os
import sys
import jwt
from datetime import datetime, timezone
from getpass import getpass

# Add the project root to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import security functions
from app.core.security import SECRET_KEY, ALGORITHM

def test_jwt_token():
    """Test JWT token validation and decoding"""
    print("🔍 NeuraSec JWT Token Test")
    print("-" * 50)
    
    # Get token from user
    token = input("Enter JWT token to validate: ")
    
    if not token:
        print("❌ No token provided")
        return
    
    try:
        # Decode the token
        decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        print("✅ Token is valid!")
        print("\nToken Payload:")
        for key, value in decoded.items():
            print(f"  - {key}: {value}")
            
        # Check expiration
        if "exp" in decoded:
            exp_time = datetime.fromtimestamp(decoded["exp"], tz=timezone.utc)
            now = datetime.now(timezone.utc)
            
            time_left = exp_time - now
            print(f"\nToken expiration: {exp_time}")
            
            if time_left.total_seconds() > 0:
                print(f"Time until expiration: {time_left}")
            else:
                print("❌ Token has expired!")
        
        # Check for user info
        if "sub" in decoded:
            print(f"\nUser email: {decoded['sub']}")
        
        if "user_id" in decoded:
            print(f"User ID: {decoded['user_id']}")
            
        if "role" in decoded:
            print(f"User role: {decoded['role']}")
            
    except jwt.ExpiredSignatureError:
        print("❌ Token has expired")
    except jwt.InvalidTokenError as e:
        print(f"❌ Invalid token: {str(e)}")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    test_jwt_token() 