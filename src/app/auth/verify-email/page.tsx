import EmailVerification from '@/components/auth/EmailVerification';
import { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Verify Email | VowSwap',
  description: 'Verify your email address for your VowSwap account',
};

export default function VerifyEmailPage() {
  return (
    <div className="container py-12">
      <Suspense fallback={<div>Loading...</div>}>
        <EmailVerification />
      </Suspense>
    </div>
  );
}
