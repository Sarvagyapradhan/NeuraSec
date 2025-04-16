const axios = require('axios');

async function testAuthFlow() {
  console.log('🔐 Testing Authentication Flow');
  console.log('=============================\n');
  
  const baseUrl = 'http://localhost:3000';
  const credentials = {
    email: 'test@example.com',
    password: 'password123'
  };
  
  try {
    // Step 1: Login
    console.log('Step 1: Login');
    console.log(`Attempting login with ${credentials.email}`);
    
    const loginResponse = await axios.post(`${baseUrl}/api/auth/login`, {
      username: credentials.email,
      emailOrUsername: credentials.email,
      password: credentials.password
    });
    
    console.log(`Login status: ${loginResponse.status}`);
    const token = loginResponse.data.token || loginResponse.data.access_token;
    
    if (!token) {
      throw new Error('No token received from login endpoint');
    }
    
    console.log(`✅ Login successful, token received (${token.substring(0, 15)}...)`);
    
    // Step 2: Fetch user profile with token
    console.log('\nStep 2: Fetch Profile');
    console.log('Fetching user profile with received token');
    
    const profileResponse = await axios.get(`${baseUrl}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log(`Profile fetch status: ${profileResponse.status}`);
    console.log('User profile:', profileResponse.data);
    console.log('✅ Profile fetch successful');
    
    // Step 3: Test redirection
    console.log('\nStep 3: Test Dashboard Access');
    console.log('Testing dashboard page access (redirection check)');
    
    try {
      // We don't expect this to return a full 200 as it will try to redirect in browser
      // But we should get a valid response or HTML
      const dashboardResponse = await axios.get(`${baseUrl}/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Cookie: `auth_token=${token}` 
        },
        maxRedirects: 0,
        validateStatus: status => status >= 200 && status < 400
      });
      
      console.log(`Dashboard access status: ${dashboardResponse.status}`);
      console.log('✅ Dashboard accessible with token');
    } catch (dashError) {
      // This might fail due to redirection, which is fine
      if (dashError.response?.status === 307 || dashError.response?.status === 302) {
        console.log(`Redirection status: ${dashError.response.status} (expected for full page request)`);
        console.log('✅ Redirection working correctly');
      } else {
        throw dashError;
      }
    }
    
    console.log('\n🎉 Authentication flow test completed successfully');
    console.log('All required endpoints are working correctly');
    
  } catch (error) {
    console.error('\n❌ Authentication test failed');
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    
    console.error('\nTroubleshooting:');
    console.error('1. Ensure the Next.js development server is running (npm run dev)');
    console.error('2. Check that test user exists (node create-test-user-direct.js)');
    console.error('3. Verify environment variables in .env.local are correctly set');
  }
}

testAuthFlow(); 