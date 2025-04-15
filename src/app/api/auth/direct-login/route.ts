import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    // Check content type
    const contentType = request.headers.get("content-type") || "";
    console.log("[DIRECT-LOGIN] Received request with content type:", contentType);
    
    let data;
    let originalData; // For debugging
    
    // Handle form-urlencoded data
    if (contentType.includes("application/x-www-form-urlencoded")) {
      // Get the raw text of the request
      originalData = await request.text();
      data = originalData;
      console.log("[DIRECT-LOGIN] Received form data:", data);
      
      // Ensure username is not decoded incorrectly
      // If data contains encoded @ symbols, log it
      if (data.includes("%40")) {
        console.log("[DIRECT-LOGIN] Data contains encoded email - this is good");
      } else if (data.includes("@")) {
        console.log("[DIRECT-LOGIN] Warning: Data contains raw @ symbol - this could cause issues");
        // Attempt to re-encode
        try {
          const params = new URLSearchParams(data);
          const username = params.get("username") || "";
          const password = params.get("password") || "";
          
          // Properly encode parameters
          data = `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
          console.log("[DIRECT-LOGIN] Re-encoded data:", data);
        } catch (e) {
          console.error("[DIRECT-LOGIN] Failed to re-encode data:", e);
          // Keep original data
        }
      }
    } 
    // Handle FormData
    else if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      // Create urlencoded string manually
      const username = formData.get("username") || formData.get("email");
      const password = formData.get("password");
      originalData = { username, password: password ? "********" : undefined };
      data = `username=${encodeURIComponent(username?.toString() || "")}&password=${encodeURIComponent(password?.toString() || "")}`;
      console.log("[DIRECT-LOGIN] Converted form data:", data);
    } 
    // Handle JSON
    else {
      try {
        const jsonData = await request.json();
        console.log("[DIRECT-LOGIN] Received JSON data:", { ...jsonData, password: jsonData.password ? "********" : undefined });
        originalData = jsonData;
        
        // Extract username/email and password
        const username = jsonData.username || jsonData.email;
        const password = jsonData.password;
        
        if (username && password) {
          // Create urlencoded string manually
          data = `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
          console.log("[DIRECT-LOGIN] Converted JSON to form data:", data);
        } else {
          throw new Error("Missing username or password in JSON data");
        }
      } catch (parseError) {
        console.error("[DIRECT-LOGIN] Failed to parse request body:", parseError);
        return NextResponse.json(
          { detail: "Invalid request format" },
          { status: 400 }
        );
      }
    }
    
    // Set headers
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded'
    };
    
    console.log(`[DIRECT-LOGIN] Sending direct login request to ${API_URL}/api/auth/direct-login`);
    
    try {
      // Send request to the backend
      const response = await axios.post(`${API_URL}/api/auth/direct-login`, data, { headers });
      console.log("[DIRECT-LOGIN] Backend response:", response.status, response.data ? "Data received" : "No data");
      
      // Return the response data
      return NextResponse.json(response.data);
    } catch (error: any) {
      console.error("[DIRECT-LOGIN] Backend direct login request failed:", {
        status: error.response?.status,
        data: error.response?.data,
        originalData: originalData
      });
      
      // Return the error response
      return NextResponse.json(
        error.response?.data || { detail: "Login failed" },
        { status: error.response?.status || 500 }
      );
    }
  } catch (error: any) {
    console.error("[DIRECT-LOGIN] Fatal error in direct login route:", error);
    
    return NextResponse.json(
      { detail: "Internal server error" },
      { status: 500 }
    );
  }
} 