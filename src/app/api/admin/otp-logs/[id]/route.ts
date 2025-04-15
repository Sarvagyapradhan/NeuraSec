import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { headers } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
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
    
    await axios.delete(`${API_URL}/api/admin/otp-logs/${id}`, {
      headers: requestHeaders,
    });
    
    return NextResponse.json({}, { status: 204 });
  } catch (error: any) {
    console.error("Admin delete OTP log API error:", error.response?.data || error.message);
    
    return NextResponse.json(
      { detail: error.response?.data?.detail || "Failed to delete OTP log" },
      { status: error.response?.status || 500 }
    );
  }
} 