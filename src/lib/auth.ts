import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export interface AuthUser {
  id: string;
  email: string;
  username: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(user: AuthUser): string {
  const payload = {
    id: user.id,
    email: user.email,
    username: user.username,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) // 7 days
  };
  
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'fallback_secret',
    { algorithm: 'HS256' }
  );
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    console.log("Verifying token...");
    
    // First try to decode without verification to check expiration
    const decodedDebug = jwt.decode(token);
    console.log("Decoded token payload:", decodedDebug);
    
    if (!decodedDebug) {
      console.log("Failed to decode token");
      return null;
    }
    
    // Check expiration
    const exp = (decodedDebug as any)?.exp;
    const now = Math.floor(Date.now() / 1000);
    
    if (exp) {
      console.log(`Token expiration: ${new Date(exp * 1000).toISOString()}`);
      console.log(`Current time: ${new Date(now * 1000).toISOString()}`);
      
      if (exp < now) {
        console.log("Token is expired");
        return null;
      }
    }
    
    // Now verify the token
    const secret = process.env.JWT_SECRET || 'fallback_secret';
    const decoded = jwt.verify(token, secret) as AuthUser;
    
    console.log("Token verified successfully");
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, username: true }
    });
    
    if (!user) {
      console.log("User not found in database");
      return null;
    }
    
    console.log("User found:", user.email);
    return user;
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}

export async function createUser(email: string, username: string, password: string): Promise<AuthUser> {
  const hashedPassword = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email,
      username,
      password: hashedPassword,
    },
    select: {
      id: true,
      email: true,
      username: true,
    }
  });
  return user;
}

export async function validateUser(emailOrUsername: string, password: string): Promise<AuthUser | null> {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: emailOrUsername },
        { username: emailOrUsername }
      ]
    }
  });

  if (!user) return null;

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) return null;

  return {
    id: user.id,
    email: user.email,
    username: user.username
  };
} 