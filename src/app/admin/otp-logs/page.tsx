"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AlertCircle, RefreshCw, Trash2 } from "lucide-react";

interface OTP {
  id: number;
  email: string;
  created_at: string;
  expiry: string;
  used: boolean;
}

export default function OTPLogsPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const { toast } = useToast();
  
  const [otps, setOtps] = useState<OTP[]>([]);
  const [adminKey, setAdminKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  
  // Check if user is admin
  useEffect(() => {
    if (!loading && isAuthenticated && user?.role === "admin") {
      setHasAccess(true);
      fetchOTPLogs();
    } else if (!loading && isAuthenticated && user?.role !== "admin") {
      toast({
        title: "Access denied",
        description: "You don't have permission to access this page",
        variant: "destructive",
      });
      router.push("/dashboard");
    }
  }, [loading, isAuthenticated, user, router, toast]);
  
  const fetchOTPLogs = async () => {
    try {
      setIsLoading(true);
      
      const headers: Record<string, string> = {};
      if (adminKey) {
        headers["X-ADMIN-KEY"] = adminKey;
      }
      
      const response = await axios.get("/api/admin/otp-logs", { headers });
      
      if (response.data?.otps) {
        setOtps(response.data.otps);
        setHasAccess(true);
      }
    } catch (error: any) {
      console.error("Failed to fetch OTP logs:", error);
      toast({
        title: "Failed to fetch OTP logs",
        description: error.response?.data?.detail || "An error occurred while fetching the logs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDelete = async (id: number) => {
    try {
      const headers: Record<string, string> = {};
      if (adminKey) {
        headers["X-ADMIN-KEY"] = adminKey;
      }
      
      await axios.delete(`/api/admin/otp-logs/${id}`, { headers });
      
      toast({
        title: "OTP log deleted",
        description: "The OTP log has been deleted successfully",
      });
      
      // Remove the deleted OTP from state
      setOtps((prev) => prev.filter((otp) => otp.id !== id));
    } catch (error: any) {
      console.error("Failed to delete OTP log:", error);
      toast({
        title: "Failed to delete",
        description: error.response?.data?.detail || "An error occurred while deleting",
        variant: "destructive",
      });
    }
  };
  
  const handleKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOTPLogs();
  };
  
  if (!hasAccess && !loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="mr-2 h-5 w-5 text-yellow-500" />
              Admin Authentication Required
            </CardTitle>
            <CardDescription>Enter your admin key to access OTP logs</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleKeySubmit} className="space-y-4">
              <Input
                placeholder="Enter admin key"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Authenticating..." : "Access Logs"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>OTP Logs</CardTitle>
              <CardDescription>View all the OTPs that have been sent to users</CardDescription>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={fetchOTPLogs}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>A list of all OTPs sent to users</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {otps.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No OTP logs found
                  </TableCell>
                </TableRow>
              ) : (
                otps.map((otp) => (
                  <TableRow key={otp.id}>
                    <TableCell>{otp.id}</TableCell>
                    <TableCell>{otp.email}</TableCell>
                    <TableCell>{new Date(otp.created_at).toLocaleString()}</TableCell>
                    <TableCell>{new Date(otp.expiry).toLocaleString()}</TableCell>
                    <TableCell>
                      {otp.used ? (
                        <Badge variant="success">Used</Badge>
                      ) : new Date(otp.expiry) < new Date() ? (
                        <Badge variant="destructive">Expired</Badge>
                      ) : (
                        <Badge variant="outline">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(otp.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 