import requests
import json

def test_api_login():
    # Backend API URL
    api_url = "http://localhost:8000/api/auth/login"
    
    # Prepare form data for OAuth2PasswordRequestForm
    data = {
        "username": "test@example.com",
        "password": "password123"
    }
    
    # Set headers for form data
    headers = {
        "Content-Type": "application/x-www-form-urlencoded"
    }
    
    try:
        print(f"Sending POST request to {api_url}")
        print(f"Data: {data}")
        
        # Make the login request
        response = requests.post(api_url, data=data, headers=headers)
        
        # Print response details
        print(f"\nResponse Status Code: {response.status_code}")
        print("Response Headers:")
        for key, value in response.headers.items():
            print(f"  {key}: {value}")
        
        try:
            response_json = response.json()
            print("\nResponse JSON:")
            print(json.dumps(response_json, indent=2))
        except:
            print("\nResponse Body (not JSON):")
            print(response.text)
        
        if response.status_code == 200:
            print("\n✅ Login succeeded!")
            
            # Get OTP code from the response if available
            otp = response.json().get("otp")
            if otp:
                print(f"OTP for verification: {otp}")
            else:
                print("No OTP found in response. Check backend logs for OTP.")
        else:
            print("\n❌ Login failed!")
    
    except Exception as e:
        print(f"Error during API test: {e}")

if __name__ == "__main__":
    test_api_login() 