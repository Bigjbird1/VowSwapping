import PasswordResetForm from '@/components/auth/PasswordResetForm';
import { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Forgot Password | VowSwap',
  description: 'Reset your VowSwap account password',
};

export default function ForgotPasswordPage() {
  return (
    <div className="container py-12">
      <Suspense fallback={<div>Loading...</div>}>
        <PasswordResetForm />
      </Suspense>
    </div>
  );
}
