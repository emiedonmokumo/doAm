'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { AppShell } from '@/components/app-shell';
import { Loader2 } from 'lucide-react';
import { isProfileComplete } from '@/lib/profile';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/sign-in');
      } else if (user && profile && !isProfileComplete(profile)) {
        router.replace('/onboarding');
      }
    }
  }, [loading, user, profile, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0e6b53]" />
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
