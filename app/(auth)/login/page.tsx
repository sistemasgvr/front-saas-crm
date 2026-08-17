import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import LoginForm from '@/src/modules/auth/LoginForm';

export default async function LoginPage() {
  const store = await cookies();
  if (store.get('access_token')?.value) {
    redirect('/dashboard');
  }

  return <LoginForm />;
}
