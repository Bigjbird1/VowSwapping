'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    if (status === 'loading') {
      setLoading(true);
    } else {
      setLoading(false);
      setUser(session?.user || null);
    }
  }, [session, status, setUser, setLoading]);

  return <>{children}</>;
}
