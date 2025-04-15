"use client";

import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";

export function AuthStatus({ showControls = true }) {
  const { user, isAuthenticated, loading } = useAuth();
  const [mountTime, setMountTime] = useState<string>(new Date().toISOString());

  useEffect(() => {
    // Just to ensure we have a mount timestamp
    setMountTime(new Date().toISOString());
  }, []);

  const forceRefresh = () => {
    window.location.reload();
  };

  const clearAuth = () => {
    localStorage.removeItem("auth_token");
    forceRefresh();
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Authentication Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-1">
            <div className="text-sm font-medium">Status:</div>
            <div>{loading ? "Loading..." : (isAuthenticated ? "Authenticated" : "Not Authenticated")}</div>
          </div>
          {isAuthenticated && user && (
            <>
              <div className="grid grid-cols-2 gap-1">
                <div className="text-sm font-medium">User Email:</div>
                <div>{user.email}</div>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <div className="text-sm font-medium">User ID:</div>
                <div>{user.id}</div>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <div className="text-sm font-medium">Role:</div>
                <div>{user.role}</div>
              </div>
            </>
          )}
          <div className="grid grid-cols-2 gap-1">
            <div className="text-sm font-medium">Component Mounted:</div>
            <div>{mountTime}</div>
          </div>
        </div>
        {showControls && (
          <div className="mt-4 flex gap-2">
            <Button onClick={forceRefresh} variant="outline" size="sm">
              Refresh Page
            </Button>
            <Button onClick={clearAuth} variant="destructive" size="sm">
              Clear Auth Data
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 