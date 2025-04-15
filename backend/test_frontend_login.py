import requests
import json
from getpass import getpass

def simulate_frontend_login():
    """Simulate how the frontend is making login requests"""
    email = "sarvagyapradhan823@gmail.com"
    password = getpass(f"Enter password for {email}: ")
    
    # Simulate the frontend login request
    # First, check the direct-login API in Next.js
    next_endpoint = "http://localhost:3000/api/auth/direct-login"
    
    # Create data similar to the frontend
    data = f"username={email}&password={password}"
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    
    print(f"Testing login through Next.js API: {next_endpoint}")
    print(f"Data: {data}")
    
    try:
        response = requests.post(
            next_endpoint,
            data=data,
            headers=headers
        )
        
        print(f"Status code: {response.status_code}")
        print(f"Response: {response.text[:200]}...")
        
        if response.status_code == 200:
            print("✅ Login via Next.js API successful!")
        else:
            print("❌ Login via Next.js API failed")
    except Exception as e:
        print(f"Error connecting to Next.js API: {str(e)}")
    
if __name__ == "__main__":
    simulate_frontend_login() 