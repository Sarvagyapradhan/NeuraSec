import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { headers } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  try {
    const headersList = headers();
    const authorization = headersList.get("authorization") || "";
    const adminKey = headersList.get("x-admin-key") || "";
    
    const requestHeaders: Record<string, string> = {};
    
    if (authorization) {
      requestHeaders.Authorization = authorization;
    }
    
    if (adminKey) {
      requestHeaders["X-ADMIN-KEY"] = adminKey;
    }
    
    if (!authorization && !adminKey) {
      return NextResponse.json(
        { detail: "Authentication required" },
        { status: 401 }
      );
    }
    
    const response = await axios.get(`${API_URL}/api/admin/otp-logs`, {
      headers: requestHeaders,
    });
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("Admin OTP logs API error:", error.response?.data || error.message);
    
    return NextResponse.json(
      { detail: error.response?.data?.detail || "Failed to fetch OTP logs" },
      { status: error.response?.status || 500 }
    );
  }
} 