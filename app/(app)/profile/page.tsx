'use client';

import { useEffect, useState } from 'react';
import { Loader2, Save, Star } from 'lucide-react';

type Profile = {
  id: string;
  full_name: string;
  username: string;
  email: string;
  bio: string | null;
  phone: string | null;
  avatar_url: string | null;
  skills: string[];
  availability: string | null;
  rating_avg: number;
  rating_count: number;
  tasks_created_count: number;
  tasks_completed_count: number;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/profile')
      .then((response) => response.json())
      .then(setProfile)
      .catch(() => setProfile(null));
  }, []);

  function update<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((current) => current ? { ...current, [key]: value } : current);
  }

  async function save() {
    if (!profile) return;
    setSaving(true);
    const response = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: profile.full_name,
        bio: profile.bio,
        phone: profile.phone,
        availability: profile.availability,
        skills: profile.skills,
      }),
    });
    setSaving(false);
    setMessage(response.ok ? 'Profile saved.' : 'Unable to save profile.');
  }

  if (!profile) return <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-[#0e6b53]" /></div>;

  return (
    <div className="mx-auto max-w-[680px]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#111827]">Your profile</h1>
        <p className="mt-1 text-sm text-[#6b7280]">Build trust through completed tasks.</p>
      </div>
      <section className="rounded-xl border border-[#e4e9e6] bg-white p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#d8f6ea] text-xl font-bold text-[#0e6b53]">{profile.full_name.charAt(0).toUpperCase()}</div>
          <div>
            <p className="text-lg font-bold text-[#27352e]">{profile.full_name}</p>
            <p className="text-sm text-[#89958f]">@{profile.username}</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-[#a86400]"><Star className="h-3.5 w-3.5 fill-current" />{profile.rating_avg.toFixed(1)} · {profile.rating_count} ratings</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-[#27352e]">Full name<input value={profile.full_name} onChange={(event) => update('full_name', event.target.value)} className="mt-1 h-11 w-full rounded-lg border border-[#e4e9e6] px-3" /></label>
          <label className="text-sm font-medium text-[#27352e]">Phone<input value={profile.phone ?? ''} onChange={(event) => update('phone', event.target.value)} className="mt-1 h-11 w-full rounded-lg border border-[#e4e9e6] px-3" /></label>
          <label className="text-sm font-medium text-[#27352e]">Availability<input value={profile.availability ?? ''} onChange={(event) => update('availability', event.target.value)} className="mt-1 h-11 w-full rounded-lg border border-[#e4e9e6] px-3" /></label>
          <label className="text-sm font-medium text-[#27352e]">Skills<input value={profile.skills.join(', ')} onChange={(event) => update('skills', event.target.value.split(',').map((skill) => skill.trim()).filter(Boolean))} className="mt-1 h-11 w-full rounded-lg border border-[#e4e9e6] px-3" /></label>
        </div>
        <label className="mt-4 block text-sm font-medium text-[#27352e]">Bio<textarea value={profile.bio ?? ''} onChange={(event) => update('bio', event.target.value)} className="mt-1 min-h-24 w-full rounded-lg border border-[#e4e9e6] p-3" /></label>
        <div className="mt-5 flex items-center gap-3">
          <button onClick={() => void save()} disabled={saving} className="flex items-center gap-2 rounded-lg bg-[#0e6b53] px-5 py-3 text-sm font-semibold text-white"><Save className="h-4 w-4" />{saving ? 'Saving…' : 'Save profile'}</button>
          {message && <span role="status" className="text-sm text-[#68766e]">{message}</span>}
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-[#eef0ee] pt-5">
          <Stat label="Tasks posted" value={profile.tasks_created_count} />
          <Stat label="Tasks completed" value={profile.tasks_completed_count} />
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg bg-[#f6f9f7] p-4"><p className="text-xs text-[#89958f]">{label}</p><p className="mt-1 text-xl font-bold text-[#0e6b53]">{value}</p></div>;
}
