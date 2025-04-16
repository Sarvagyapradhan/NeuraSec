import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { validateUser, generateToken } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    // Get request data in various formats
    let username = "";
    let password = "";
    
    const contentType = request.headers.get("content-type") || "";
    console.log("[DIRECT-LOGIN] Content type:", contentType);
    
    try {
      // Handle the different content types
      if (contentType.includes("application/json")) {
        const jsonData = await request.json();
        username = jsonData.username || jsonData.email || jsonData.emailOrUsername || "";
        password = jsonData.password || "";
      } else if (contentType.includes("application/x-www-form-urlencoded")) {
        const formData = await request.text();
        const params = new URLSearchParams(formData);
        username = params.get("username") || params.get("email") || params.get("emailOrUsername") || "";
        password = params.get("password") || "";
      } else if (contentType.includes("multipart/form-data")) {
        const formData = await request.formData();
        username = formData.get("username")?.toString() || 
                  formData.get("email")?.toString() || 
                  formData.get("emailOrUsername")?.toString() || "";
        password = formData.get("password")?.toString() || "";
      }
    } catch (parseError) {
      console.error("[DIRECT-LOGIN] Failed to parse request body:", parseError);
      return NextResponse.json(
        { error: "Invalid request format" },
        { status: 400 }
      );
    }
    
    // Check if username and password are provided
    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }
    
    console.log("[DIRECT-LOGIN] Attempting authentication for:", username);
    
    // First, try local authentication
    try {
      const user = await validateUser(username, password);
      
      if (user) {
        console.log("[DIRECT-LOGIN] Local authentication successful");
        
        // Generate JWT token
        const token = generateToken(user);
        
        // Create response with JWT token
        const response = NextResponse.json({
          access_token: token,
          token_type: "bearer",
          user: {
            id: user.id,
            email: user.email,
            username: user.username
          }
        });
        
        // Set auth token cookie
        response.cookies.set('auth_token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 60 * 60 * 24 * 7, // 7 days
        });
        
        return response;
      }
    } catch (localAuthError) {
      console.error("[DIRECT-LOGIN] Local auth failed:", localAuthError);
      // Continue to backend auth
    }
    
    // Try backend authentication
    try {
      // Create form data for backend
      const formData = `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
      
      // Send request to backend
      const response = await axios.post(`${API_URL}/api/auth/direct-login`, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      console.log("[DIRECT-LOGIN] Backend authentication response:", response.status);
      
      if (response.data && response.data.access_token) {
        // Create response with JWT token
        const nextResponse = NextResponse.json(response.data);
        
        // Set auth token cookie
        nextResponse.cookies.set('auth_token', response.data.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 60 * 60 * 24 * 7, // 7 days
        });
        
        return nextResponse;
      }
      
      // Return backend response if no access token
      return NextResponse.json(response.data);
    } catch (backendError: any) {
      console.error("[DIRECT-LOGIN] Backend auth failed:", backendError.message);
      
      // Return backend error response
      if (backendError.response) {
        return NextResponse.json(
          backendError.response.data || { error: "Authentication failed" },
          { status: backendError.response.status || 401 }
        );
      }
      
      // Return general error for connection issues
      return NextResponse.json(
        { error: "Failed to connect to authentication service" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("[DIRECT-LOGIN] Unexpected error:", error);
    
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
} 