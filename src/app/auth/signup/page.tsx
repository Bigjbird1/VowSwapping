import SignUpForm from '@/components/auth/SignUpForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up | VowSwap',
  description: 'Create a new VowSwap account',
};

export default function SignUpPage() {
  return (
    <div className="container py-12">
      <SignUpForm />
    </div>
  );
}
