import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

// Add static generation configuration
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ProfilePage() {
  // Server-side redirect to login
  redirect('/login');
} 