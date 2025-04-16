import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import jwt from 'jsonwebtoken';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  try {
    // First try to get token from Authorization header
    let token = null;
    const authHeader = request.headers.get("Authorization");
    
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
      console.log("[me] Found token in Authorization header");
    }
    
    // If not found in header, try cookies
    if (!token) {
      token = request.cookies.get("auth_token")?.value;
      if (token) {
        console.log("[me] Found token in cookies");
      }
    }
    
    // If still no token, return unauthorized
    if (!token) {
      console.log("[me] No authentication token provided");
      return NextResponse.json(
        { error: "No authentication token provided" },
        { status: 401 }
      );
    }
    
    // Try to decode the token without verification for debugging
    try {
      const decodedDebug = jwt.decode(token);
      console.log("Token payload:", decodedDebug);
      
      // Check if token is expired
      const exp = (decodedDebug as any)?.exp;
      if (exp) {
        const now = Math.floor(Date.now() / 1000);
        console.log(`Token expiration: ${new Date(exp * 1000).toISOString()}, now: ${new Date(now * 1000).toISOString()}`);
        console.log(`Token ${exp < now ? 'is expired' : 'is valid'}`);
      }
    } catch (decodeError) {
      console.log("Error decoding token:", decodeError);
    }
    
    console.log("[me] Verifying user token");
    const user = await verifyToken(token);

    if (!user) {
      console.log("[me] Invalid or expired token");
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    console.log("[me] User authenticated successfully:", user.email);
    return NextResponse.json({
      id: user.id,
      email: user.email,
      username: user.username
    });
  } catch (error) {
    console.error("[me] Profile fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
} 