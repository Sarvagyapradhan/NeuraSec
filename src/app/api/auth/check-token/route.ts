import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Get token from URL parameters first (this is how the frontend sends it)
    let token = request.nextUrl.searchParams.get("token");
    
    if (token) {
      console.log("[check-token] Found token in URL parameters");
    }
    
    // If not in URL params, try Authorization header
    if (!token) {
      const authHeader = request.headers.get("Authorization");
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
        console.log("[check-token] Found token in Authorization header");
      }
    }
    
    // If still not found, try cookies
    if (!token) {
      token = request.cookies.get("auth_token")?.value;
      if (token) {
        console.log("[check-token] Found token in cookies");
      }
    }
    
    // If still no token, return unauthorized
    if (!token) {
      console.log("[check-token] No authentication token provided");
      return NextResponse.json(
        { valid: false, reason: "No token provided" },
        { status: 401 }
      );
    }
    
    console.log("[check-token] Verifying token");
    const user = await verifyToken(token);

    if (!user) {
      console.log("[check-token] Invalid or expired token");
      return NextResponse.json(
        { valid: false, reason: "Invalid or expired token" },
        { status: 401 }
      );
    }

    console.log("[check-token] Token is valid for user:", user.email);
    return NextResponse.json({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    });
  } catch (error) {
    console.error("[check-token] Error:", error);
    // Explicitly create the error response object
    const errorResponse = {
      valid: false, 
      reason: error instanceof Error ? error.message : "Token validation failed due to an unknown error"
    };
    return NextResponse.json(errorResponse, { status: 500 }); // Use 500 for server error
  }
} 