const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing login with test user credentials...');
    console.log('Email: test@example.com');
    console.log('Password: password123');
    
    // Try frontend login API
    console.log('\nTesting frontend /api/auth/login...');
    try {
      const frontendResponse = await axios.post('http://localhost:3000/api/auth/login', {
        username: 'test@example.com',
        password: 'password123'
      });
      
      console.log('Frontend login response status:', frontendResponse.status);
      console.log('Frontend login response data:', JSON.stringify(frontendResponse.data, null, 2));
      
      if (frontendResponse.data && (frontendResponse.data.token || frontendResponse.data.message === 'Login successful')) {
        console.log('✓ Frontend login successful');
      } else {
        console.log('❌ Frontend login failed or unexpected response');
      }
    } catch (frontendError) {
      console.error('❌ Frontend login error:', frontendError.message);
      if (frontendError.response) {
        console.error('Error status:', frontendError.response.status);
        console.error('Error data:', frontendError.response.data);
      }
    }
    
    // Try frontend direct login API
    console.log('\nTesting frontend /api/auth/direct-login...');
    try {
      const directResponse = await axios.post('http://localhost:3000/api/auth/direct-login', {
        username: 'test@example.com',
        password: 'password123'
      });
      
      console.log('Direct login response status:', directResponse.status);
      console.log('Direct login response data:', JSON.stringify(directResponse.data, null, 2));
      
      if (directResponse.data && (directResponse.data.access_token || directResponse.data.token)) {
        console.log('✓ Direct login successful');
      } else {
        console.log('❌ Direct login failed or unexpected response');
      }
    } catch (directError) {
      console.error('❌ Direct login error:', directError.message);
      if (directError.response) {
        console.error('Error status:', directError.response.status);
        console.error('Error data:', directError.response.data);
      }
    }
    
    // Try backend direct login API
    console.log('\nTesting backend /api/auth/direct-login...');
    try {
      const backendResponse = await axios.post('http://localhost:8000/api/auth/direct-login', 
        `username=test@example.com&password=password123`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      console.log('Backend login response status:', backendResponse.status);
      console.log('Backend login response data:', JSON.stringify(backendResponse.data, null, 2));
      
      if (backendResponse.data && backendResponse.data.access_token) {
        console.log('✓ Backend login successful');
      } else {
        console.log('❌ Backend login failed or unexpected response');
      }
    } catch (backendError) {
      console.error('❌ Backend login error:', backendError.message);
      if (backendError.response) {
        console.error('Error status:', backendError.response.status);
        console.error('Error data:', backendError.response.data);
      }
    }
    
    console.log('\nLogin testing completed');
  } catch (error) {
    console.error('❌ An unexpected error occurred:', error);
  }
}

testLogin(); 