import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await axios.post(`${API_URL}/api/auth/verify-registration`, body);
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("Verify registration API error:", error.response?.data || error.message);
    
    return NextResponse.json(
      { detail: error.response?.data?.detail || "Registration verification failed" },
      { status: error.response?.status || 500 }
    );
  }
} 