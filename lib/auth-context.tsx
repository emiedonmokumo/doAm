'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { signOut, useSession } from 'next-auth/react';

export type Profile = { id: string; full_name: string; username: string; email: string; bio: string | null; avatar_url: string | null; phone: string | null; skills: string[] | null; availability: string | null; rating_avg: number; rating_count: number; doams_created_count: number; doams_completed_count: number; location_set: boolean };
type AuthContextType = { user: { id: string; email?: string | null } | null; profile: Profile | null; loading: boolean; signOut: () => Promise<void>; refreshProfile: () => Promise<void> };
const AuthContext = createContext<AuthContextType>({ user: null, profile: null, loading: true, signOut: async () => {}, refreshProfile: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const refreshProfile = async () => {
    if (!session?.user?.id) return setProfile(null);
    setProfileLoading(true);
    try {
      const response = await fetch('/api/profile', { cache: 'no-store' });
      setProfile(response.ok ? await response.json() : null);
    } finally {
      setProfileLoading(false);
    }
  };
  useEffect(() => { void refreshProfile(); }, [session?.user?.id]);
  const user = session?.user?.id ? { id: session.user.id, email: session.user.email } : null;
  return <AuthContext.Provider value={{ user, profile, loading: status === 'loading' || Boolean(session?.user?.id && profileLoading), signOut: async () => { await signOut({ callbackUrl: '/' }); }, refreshProfile }}>{children}</AuthContext.Provider>;
}
export function useAuth() { return useContext(AuthContext); }
