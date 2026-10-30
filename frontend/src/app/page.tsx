import { redirect } from 'next/navigation';
import { ROUTES } from '@/lib/routes';

// Middleware sends visitors without a session on to the login page.
export default function HomePage() {
  redirect(ROUTES.tasks);
}
