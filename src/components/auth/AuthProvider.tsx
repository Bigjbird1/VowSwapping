'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Session } from 'next-auth';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const errorRef = useRef<Error | null>(null);
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
    errorRef.current = sessionError;
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
      if (errorRef.current) {
        setAuthStoreError(errorRef.current.message);
        // Clear the error after handling it
        errorRef.current = null;
      }
    } catch (err) {
      // Handle any errors in the effect itself
      console.error('Error in auth effect:', err);
      setLoading(false);
      setUser(null);
      
      const effectError = err instanceof Error ? err : new Error('Unknown auth effect error');
      errorRef.current = effectError;
      setAuthStoreError(effectError.message);
    }
  }, [sessionData, sessionStatus, setUser, setLoading, setAuthStoreError]);

  // If there was a critical error that prevents rendering, we could show a fallback UI
  // For now, we'll just continue rendering children since we've handled the error

  return <>{children}</>;
}
