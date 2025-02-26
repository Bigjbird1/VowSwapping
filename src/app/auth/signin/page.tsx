import SignInForm from '@/components/auth/SignInForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In | VowSwap',
  description: 'Sign in to your VowSwap account',
};

export default function SignInPage() {
  return (
    <div className="container py-12">
      <SignInForm />
    </div>
  );
}
