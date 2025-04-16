import { NextRequest, NextResponse } from 'next/server';
import { validateUser, generateToken } from '@/lib/auth';
import axios from 'axios';

// This is a fixed local login route that works with either our local auth or the backend API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Login attempt with data:', { ...body, password: body.password ? '[REDACTED]' : undefined });
    
    // Extract username and password from the request
    const username = body.username || body.emailOrUsername || body.email;
    const password = body.password;
    
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }
    
    // First try direct validation with local auth
    try {
      console.log('Attempting local authentication...');
      const user = await validateUser(username, password);
      
      if (user) {
        console.log('Local authentication successful for user:', user.email);
        // Generate JWT token
        const token = generateToken(user);
        
        // Set HTTP-only cookie with the token
        const response = NextResponse.json({
          message: 'Login successful',
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
          },
          token,
        });
        
        response.cookies.set('auth_token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 60 * 60 * 24 * 7, // 7 days
        });
        
        return response;
      }
    } catch (localAuthError) {
      console.error('Local auth error:', localAuthError);
      // Continue to try backend auth if local auth fails
    }
    
    // If local auth fails, try the backend direct login
    console.log('Attempting backend authentication...');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    try {
      const backendResponse = await axios.post(
        `${apiUrl}/api/auth/direct-login`,
        `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      
      console.log('Backend auth response:', backendResponse.status);
      
      if (backendResponse.data && backendResponse.data.access_token) {
        console.log('Backend authentication successful');
        
        // Create a response with the token
        const response = NextResponse.json({
          message: 'Login successful',
          token: backendResponse.data.access_token,
        });
        
        // Set the auth token cookie
        response.cookies.set('auth_token', backendResponse.data.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 60 * 60 * 24 * 7, // 7 days
        });
        
        return response;
      }
    } catch (backendError) {
      console.error('Backend auth error:', backendError.message);
      // Handle backend errors
    }
    
    // If both authentication methods fail, return error
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Failed to log in' },
      { status: 500 }
    );
  }
} 