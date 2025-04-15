import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  try {
    // Get the auth token from the request
    const authHeader = request.headers.get("Authorization");
    
    if (!authHeader) {
      return NextResponse.json(
        { detail: "Authentication credentials were not provided" },
        { status: 401 }
      );
    }

    console.log("[/api/auth/me] Received request with auth token");
    
    try {
      // Forward the request to the backend
      const response = await axios.get(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: authHeader
        }
      });
      
      console.log("[/api/auth/me] Backend response successful");
      
      // Return the response data
      return NextResponse.json(response.data);
    } catch (error: any) {
      console.error("[/api/auth/me] Backend request failed:", {
        status: error.response?.status,
        data: error.response?.data
      });
      
      // Return the error response
      return NextResponse.json(
        error.response?.data || { detail: "Failed to fetch user data" },
        { status: error.response?.status || 500 }
      );
    }
  } catch (error: any) {
    console.error("[/api/auth/me] Fatal error:", error);
    
    return NextResponse.json(
      { detail: "Internal server error" },
      { status: 500 }
    );
  }
} 