// Auth Debugging Script
// Save this file, then copy and paste it into your browser console
// when you're on your application pages to debug authentication issues

(function() {
  console.log('🔍 Auth Debugging Tool');
  console.log('====================');
  
  // Check for auth token in localStorage
  const localStorageToken = localStorage.getItem('auth_token');
  console.log('Auth token in localStorage:', localStorageToken ? 
    `✅ Found (${localStorageToken.substring(0, 15)}...)` : 
    '❌ Not found');
  
  // Check for auth token in cookies
  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {});
  
  console.log('Auth token in cookies:', cookies['auth_token'] ? 
    `✅ Found (${decodeURIComponent(cookies['auth_token']).substring(0, 15)}...)` : 
    '❌ Not found');
  
  // Check Authorization header in recent requests
  console.log('\nChecking recent requests for Authorization header:');
  console.log('(Open Network tab and refresh page to see more details)');
  
  // Check current page URL
  const currentUrl = window.location.href;
  console.log('\nCurrent page:', currentUrl);
  
  if (currentUrl.includes('/dashboard')) {
    console.log('✅ You are on the dashboard page - authentication successful');
  } else if (currentUrl.includes('/login')) {
    console.log('⚠️ You are on the login page - not authenticated or being redirected');
  }
  
  // Provide manual fix instructions
  console.log('\n🔧 Manual fixes:');
  console.log('1. To clear auth data:');
  console.log('   localStorage.removeItem("auth_token")');
  console.log('   document.cookie="auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"');
  
  console.log('2. To manually redirect to dashboard:');
  console.log('   window.location.href = "/dashboard"');
  
  console.log('\n3. To check your user data:');
  if (localStorageToken) {
    console.log('   Try running this in the console:');
    console.log('   fetch("/api/auth/me", {headers: {"Authorization": `Bearer ${localStorage.getItem("auth_token")}`}}).then(r=>r.json()).then(console.log)');
  }
  
  return 'Auth debugging complete. Check console output for details.';
})(); 