import os
import sys
import requests
from getpass import getpass
from urllib.parse import urljoin, quote

# Add the project root to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def encode_form_url(email, password):
    """Properly encode form URL data"""
    return f"username={quote(email)}&password={quote(password)}"

def test_direct_login():
    print("🔍 NeuraSec Direct Login Test")
    print("-" * 50)
    
    # Get the API URL from environment or use default
    api_url = os.environ.get("NEXT_PUBLIC_API_URL", "http://localhost:8000")
    login_endpoint = urljoin(api_url, "/api/auth/direct-login")
    
    # Get credentials - use default email but prompt for password
    email = "sarvagyapradhan823@gmail.com"
    password = getpass(f"Enter password for {email}: ")
    
    print(f"Testing direct login at: {login_endpoint}")
    
    # Test with different payloads and content types
    test_scenarios = [
        {
            "name": "Standard form-urlencoded",
            "payload": encode_form_url(email, password),
            "headers": {'Content-Type': 'application/x-www-form-urlencoded'}
        },
        {
            "name": "Plain data dictionary",
            "payload": {"username": email, "password": password},
            "headers": {'Content-Type': 'application/json'}
        },
        {
            "name": "JSON with email key instead of username",
            "payload": {"email": email, "password": password},
            "headers": {'Content-Type': 'application/json'}
        },
        {
            "name": "Form data with special encoding",
            "payload": f"username={email}&password={password}",
            "headers": {'Content-Type': 'application/x-www-form-urlencoded'}
        }
    ]
    
    for scenario in test_scenarios:
        print("\n" + "-" * 20)
        print(f"Testing scenario: {scenario['name']}")
        
        content_type = scenario['headers']['Content-Type']
        print(f"Content-Type: {content_type}")
        
        # For debugging
        if content_type == 'application/x-www-form-urlencoded':
            print(f"Payload: {scenario['payload']}")
        else:
            print(f"Payload: {scenario['payload']}")
        
        try:
            # Send request with appropriate method based on content type
            if content_type == 'application/json':
                response = requests.post(
                    login_endpoint, 
                    json=scenario['payload'], 
                    headers=scenario['headers']
                )
            else:
                response = requests.post(
                    login_endpoint, 
                    data=scenario['payload'], 
                    headers=scenario['headers']
                )
            
            print(f"HTTP Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Login successful!")
                print(f"Access token: {data['access_token'][:20]}...")
            else:
                print(f"❌ Login failed: {response.text}")
                
        except Exception as e:
            print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    test_direct_login() 