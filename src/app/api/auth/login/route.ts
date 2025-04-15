import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    // Check content type
    const contentType = request.headers.get("content-type") || "";
    console.log("Received request with content type:", contentType);
    
    let data;
    
    // Handle form-urlencoded data - this is the format we need
    if (contentType.includes("application/x-www-form-urlencoded")) {
      // Get the raw text of the request
      data = await request.text();
      console.log("Received form data:", data);
    } 
    // Handle FormData
    else if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      // Create urlencoded string manually
      const username = formData.get("username") || formData.get("email");
      const password = formData.get("password");
      data = `username=${encodeURIComponent(username?.toString() || "")}&password=${encodeURIComponent(password?.toString() || "")}`;
      console.log("Converted form data:", data);
    } 
    // Handle JSON
    else {
      try {
        const jsonData = await request.json();
        console.log("Received JSON data:", jsonData);
        
        // Extract email/username and password
        const username = jsonData.username || jsonData.email;
        const password = jsonData.password;
        
        if (username && password) {
          // Create urlencoded string manually
          data = `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
          console.log("Converted JSON to form data:", data);
        } else {
          throw new Error("Missing username or password in JSON data");
        }
      } catch (parseError) {
        console.error("Failed to parse request body:", parseError);
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
    
    console.log(`Sending request to ${API_URL}/api/auth/login`);
    
    try {
      // Send request to the backend
      const response = await axios.post(`${API_URL}/api/auth/login`, data, { headers });
      console.log("Backend response:", response.status, response.data);
      
      // Return the response data
      return NextResponse.json(response.data);
    } catch (error: any) {
      console.error("Backend request failed:", {
        status: error.response?.status,
        data: error.response?.data
      });
      
      // Return the error response
      return NextResponse.json(
        error.response?.data || { detail: "Login failed" },
        { status: error.response?.status || 500 }
      );
    }
  } catch (error: any) {
    console.error("Fatal error in login route:", error);
    
    return NextResponse.json(
      { detail: "Internal server error" },
      { status: 500 }
    );
  }
} 