'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Session } from 'next-auth';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [error, setError] = useState<Error | null>(null);
  const { setUser, setLoading, setError: setAuthStoreError } = useAuthStore();
  
  // Wrap useSession in try-catch to prevent rendering crashes
  let sessionData: Session | null = null;
  let sessionStatus: 'loading' | 'authenticated' | 'unauthenticated' = 'loading';
  
  try {
    const { data: session, status } = useSession();
    sessionData = session;
    sessionStatus = status;
  } catch (err) {
    // If useSession throws, capture the error and set a fallback status
    const sessionError = err instanceof Error ? err : new Error('Unknown session error');
    setError(sessionError);
    console.error('Session error:', sessionError);
    sessionStatus = 'unauthenticated';
  }

  useEffect(() => {
    try {
      if (sessionStatus === 'loading') {
        setLoading(true);
      } else {
        setLoading(false);
        setUser(sessionData?.user || null);
      }
      
      // If there was an error, update the auth store
      if (error) {
        setAuthStoreError(error.message);
      }
    } catch (err) {
      // Handle any errors in the effect itself
      console.error('Error in auth effect:', err);
      setLoading(false);
      setUser(null);
      
      const effectError = err instanceof Error ? err : new Error('Unknown auth effect error');
      setError(effectError);
      setAuthStoreError(effectError.message);
    }
  }, [sessionData, sessionStatus, setUser, setLoading, setAuthStoreError, error]);

  // If there was a critical error that prevents rendering, we could show a fallback UI
  // For now, we'll just continue rendering children since we've handled the error

  return <>{children}</>;
}
