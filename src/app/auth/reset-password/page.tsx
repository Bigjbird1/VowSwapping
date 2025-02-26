import PasswordResetForm from '@/components/auth/PasswordResetForm';
import { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Reset Password | VowSwap',
  description: 'Reset your VowSwap account password',
};

export default function ResetPasswordPage() {
  return (
    <div className="container py-12">
      <Suspense fallback={<div>Loading...</div>}>
        <PasswordResetForm />
      </Suspense>
    </div>
  );
}
