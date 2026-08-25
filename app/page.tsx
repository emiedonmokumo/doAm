'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { Loader2, Plus, MapPin, Users, Star, ArrowRight } from 'lucide-react';
import { isProfileComplete } from '@/lib/profile';

export default function LandingPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user && profile) {
        router.replace(isProfileComplete(profile) ? '/home' : '/onboarding');
      }
    }
  }, [loading, user, profile, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f8f7]">
        <Loader2 className="h-8 w-8 animate-spin text-[#0e6b53]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f8f7]">
      {/* Hero */}
      <div className="mx-auto max-w-[1100px] px-5 pt-12 pb-8 lg:pt-20">
        <div className="flex items-center gap-3 mb-12">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-[0_4px_18px_rgba(14,107,83,0.12)] ring-1 ring-[#dcefe7]">
            <img src="/ChatGPT_Image_Aug_22,_2026,_04_14_29_PM.png" alt="DoAm" className="h-full w-full object-cover" />
          </div>
          <span className="text-2xl font-bold tracking-[-0.04em] text-[#111827]">DoAm</span>
        </div>

        <div className="max-w-[640px]">
          <h1 className="text-[36px] font-bold leading-[1.05] tracking-[-0.04em] text-[#111827] sm:text-[52px]">
            Small problems.<br />
            <span className="text-[#0e6b53]">Nearby solutions.</span>
          </h1>
          <p className="mt-5 text-lg leading-7 text-[#5a6a62]">
            Post something you need done. Someone nearby sees it. They help you out.
            Both people benefit. It's that simple.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0e6b53] px-7 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(14,107,83,0.18)] transition hover:-translate-y-0.5 hover:bg-[#095640]"
            >
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/sign-in"
              className="flex h-12 items-center justify-center rounded-xl border border-[#dce5e0] bg-white px-7 text-sm font-semibold text-[#3a4a42] transition hover:bg-[#f0f5f2]"
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* Feature cards */}
        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          <FeatureCard
            icon={<Plus className="h-5 w-5" />}
            title="Post a DoAm"
            description="Quickly share what you need. Set a reward, location, and time."
          />
          <FeatureCard
            icon={<MapPin className="h-5 w-5" />}
            title="Discover nearby"
            description="Browse opportunities on a map or feed, filtered by distance."
          />
          <FeatureCard
            icon={<Star className="h-5 w-5" />}
            title="Build reputation"
            description="Complete DoAms, get rated, and grow your standing in the community."
          />
        </div>
      </div>

      <div className="border-t border-[#e4e9e6] bg-white">
        <div className="mx-auto max-w-[1100px] px-5 py-8">
          <p className="text-center text-sm text-[#89958f]">
            DoAm — connecting communities across Nigeria
          </p>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-[#e4e9e6] bg-white p-6">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf7f2] text-[#0e6b53]">
        {icon}
      </div>
      <h3 className="font-bold text-[#1a2821]">{title}</h3>
      <p className="mt-1.5 text-sm leading-6 text-[#748079]">{description}</p>
    </div>
  );
}
