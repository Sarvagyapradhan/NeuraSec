import requests
import json

def test_login_variations():
    """Test various formats of login requests to identify what works"""
    
    # Backend API URL
    api_url = "http://localhost:8000/api/auth/login"
    
    # Credentials
    username = "test@example.com"
    password = "password123"
    
    print("Testing different login formats...\n")
    
    # Test 1: Form data as dictionary
    print("Test 1: Form data as dictionary")
    headers1 = {'Content-Type': 'application/x-www-form-urlencoded'}
    data1 = {'username': username, 'password': password}
    
    try:
        response1 = requests.post(api_url, data=data1, headers=headers1)
        print(f"Status: {response1.status_code}")
        print(f"Response: {response1.text}\n")
    except Exception as e:
        print(f"Error: {e}\n")
    
    # Test 2: Raw string
    print("Test 2: Raw string")
    headers2 = {'Content-Type': 'application/x-www-form-urlencoded'}
    data2 = f"username={username}&password={password}"
    
    try:
        response2 = requests.post(api_url, data=data2, headers=headers2)
        print(f"Status: {response2.status_code}")
        print(f"Response: {response2.text}\n")
    except Exception as e:
        print(f"Error: {e}\n")
    
    # Test 3: JSON
    print("Test 3: JSON data")
    headers3 = {'Content-Type': 'application/json'}
    data3 = {'username': username, 'password': password}
    
    try:
        response3 = requests.post(api_url, json=data3, headers=headers3)
        print(f"Status: {response3.status_code}")
        print(f"Response: {response3.text}\n")
    except Exception as e:
        print(f"Error: {e}\n")
    
    # Test 4: URLEncoded using params
    print("Test 4: URLEncoded using params")
    headers4 = {'Content-Type': 'application/x-www-form-urlencoded'}
    params4 = {'username': username, 'password': password}
    
    try:
        response4 = requests.post(api_url, params=params4, headers=headers4)
        print(f"Status: {response4.status_code}")
        print(f"Response: {response4.text}\n")
    except Exception as e:
        print(f"Error: {e}\n")

if __name__ == "__main__":
    test_login_variations() 