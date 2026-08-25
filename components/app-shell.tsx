'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home as HomeIcon, Compass, Plus, MessageCircle, UserRound, Bell, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/home', label: 'Home', icon: HomeIcon },
  { href: '/explore', label: 'Explore', icon: Compass },
  { href: '/create', label: 'Create', icon: Plus, isCenter: true },
  { href: '/messages', label: 'Messages', icon: MessageCircle },
  { href: '/profile', label: 'Profile', icon: UserRound },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, signOut, user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    fetch('/api/notifications/unread-count').then((response) => response.ok ? response.json() : { count: 0 }).then((data: { count: number }) => setUnreadCount(data.count));
  }, [user, pathname]);

  return (
    <div className="min-h-screen bg-[#f6f8f7]">
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-[240px] flex-col border-r border-[#e4e9e6] bg-white lg:flex">
        <div className="flex items-center gap-2.5 px-6 py-5">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white shadow-[0_4px_18px_rgba(14,107,83,0.12)] ring-1 ring-[#dcefe7]">
            <img src="/ChatGPT_Image_Aug_22,_2026,_04_14_29_PM.png" alt="DoAm" className="h-full w-full object-cover" />
          </div>
          <span className="text-xl font-bold tracking-[-0.04em] text-[#111827]">DoAm</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            if (item.isCenter) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="mx-auto my-2 flex h-12 w-12 items-center justify-center rounded-xl bg-[#0e6b53] text-white shadow-[0_6px_16px_rgba(14,107,83,0.25)] transition hover:-translate-y-0.5 hover:bg-[#095640]"
                >
                  <Icon className="h-6 w-6" />
                </Link>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition',
                  isActive ? 'bg-[#edf7f2] text-[#0e6b53]' : 'text-[#6e7c74] hover:bg-[#f3f6f4]'
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[#eef0ee] p-3">
          <Link
            href="/notifications"
            className="mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#6e7c74] transition hover:bg-[#f3f6f4]"
          >
            <Bell className="h-5 w-5" />
            Notifications
          </Link>
          <div className="flex items-center gap-3 rounded-xl px-3 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d8f6ea] text-xs font-bold text-[#0e6b53]">
              {profile?.full_name?.charAt(0)?.toUpperCase() ?? 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[#27352e]">{profile?.full_name ?? 'User'}</p>
              <p className="truncate text-xs text-[#89958f]">@{profile?.username ?? 'user'}</p>
            </div>
            <button
              onClick={async () => { await signOut(); router.push('/'); }}
              className="text-xs font-semibold text-[#a0aaa5] hover:text-[#e06f60]"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[#e4e9e6] bg-white/95 px-4 backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-[#dcefe7]">
            <img src="/ChatGPT_Image_Aug_22,_2026,_04_14_29_PM.png" alt="DoAm" className="h-full w-full object-cover" />
          </div>
          <span className="text-lg font-bold tracking-[-0.04em] text-[#111827]">DoAm</span>
        </div>
        <div className="flex items-center gap-1">
          <Link href="/notifications" className="relative flex h-10 w-10 items-center justify-center rounded-xl text-[#53635b]">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#e8704a] ring-2 ring-white" />}
          </Link>
          <button onClick={() => setMenuOpen(!menuOpen)} className="flex h-10 w-10 items-center justify-center rounded-xl text-[#53635b]">
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="absolute right-4 top-14 z-40 w-48 rounded-2xl border border-[#e4e9e6] bg-white p-2 shadow-xl lg:hidden">
          <button
            onClick={async () => { await signOut(); router.push('/'); }}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#e06f60] hover:bg-[#fff3f2]"
          >
            Sign out
          </button>
        </div>
      )}

      {/* Main content */}
      <div className="lg:pl-[240px]">
        <main className="mx-auto max-w-[900px] px-4 pb-24 pt-4 lg:px-8 lg:pb-8 lg:pt-8">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-[68px] items-center justify-around border-t border-[#e4e9e6] bg-white/95 px-2 backdrop-blur-xl lg:hidden">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          if (item.isCenter) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="-mt-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0e6b53] text-white shadow-[0_8px_20px_rgba(14,107,83,0.3)]"
              >
                <Icon className="h-6 w-6" />
              </Link>
            );
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex w-16 flex-col items-center gap-1 text-[10px] font-semibold',
                isActive ? 'text-[#0e6b53]' : 'text-[#93a099]'
              )}
            >
              <Icon className="h-[22px] w-[22px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
