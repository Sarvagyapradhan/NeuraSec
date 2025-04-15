import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  try {
    // Get authorization code from query parameters
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    
    if (!code) {
      return NextResponse.redirect(new URL("/login?error=no_code", request.url));
    }
    
    // Send authorization code to backend
    const response = await axios.post(`${API_URL}/api/auth/google`, { code });
    
    if (response.data?.access_token) {
      // Redirect to client with token in query params (will be extracted by client-side JS)
      return NextResponse.redirect(
        new URL(`/auth/google/success?token=${response.data.access_token}`, request.url)
      );
    } else {
      return NextResponse.redirect(new URL("/login?error=invalid_token", request.url));
    }
  } catch (error: any) {
    console.error("Google auth callback error:", error.response?.data || error.message);
    
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.response?.data?.detail || "auth_failed")}`, request.url)
    );
  }
} 