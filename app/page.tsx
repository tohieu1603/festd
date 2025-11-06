import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to dashboard or login based on auth status
  // Since we can't check auth on server side easily, redirect to dashboard
  // and let middleware handle authentication
  redirect('/dashboard');
}
