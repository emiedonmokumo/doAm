'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SignUpPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

    const response = await fetch('/api/register', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ fullName, username: cleanUsername, email, password }) });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error?.message ?? 'Unable to create your account. Please try again.');
      setLoading(false);
      return;
    }
    const signInResult = await signIn('credentials', { email, password, redirect: false });
    if (signInResult?.error) {
      setError('Your account was created, but automatic sign-in failed. Please sign in manually.');
      setLoading(false);
      return;
    }
    router.replace('/home');
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f6f8f7]">
      <div className="flex items-center gap-3 px-5 pt-6">
        <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-xl text-[#53635b] hover:bg-[#eef6f2]">
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-5 py-8">
        <div className="w-full max-w-[400px]">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-[0_4px_18px_rgba(14,107,83,0.12)] ring-1 ring-[#dcefe7]">
              <img src="/ChatGPT_Image_Aug_22,_2026,_04_14_29_PM.png" alt="DoAm" className="h-full w-full object-cover" />
            </div>
            <h1 className="text-2xl font-bold tracking-[-0.03em] text-[#111827]">Join DoAm</h1>
            <p className="mt-1.5 text-sm text-[#6b7280]">Create your account and start helping your community</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="e.g. Adaora Obi"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="h-12 rounded-xl border-[#e2e9e5] bg-[#fbfcfb] focus:border-[#0e6b53] focus:ring-[#0e6b53]/10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="e.g. adaora_obi"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="h-12 rounded-xl border-[#e2e9e5] bg-[#fbfcfb] focus:border-[#0e6b53] focus:ring-[#0e6b53]/10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 rounded-xl border-[#e2e9e5] bg-[#fbfcfb] focus:border-[#0e6b53] focus:ring-[#0e6b53]/10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-12 rounded-xl border-[#e2e9e5] bg-[#fbfcfb] focus:border-[#0e6b53] focus:ring-[#0e6b53]/10"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-xl bg-[#0e6b53] text-base font-semibold hover:bg-[#095640]"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Create account'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-[#6b7280]">
            Already have an account?{' '}
            <Link href="/sign-in" className="font-semibold text-[#0e6b53] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
