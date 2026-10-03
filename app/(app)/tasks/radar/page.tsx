'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type NearbyTask = { id: string; title: string; description: string | null; category: string; runnerFee: number; estimatedExpenses: number; settlementMethod: string; pickupArea: string; pickupCity: string; pickupRegion: string; distanceKm: number };
const money = (value: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value);

export default function RadarPage() {
  const [tasks, setTasks] = useState<NearbyTask[]>([]);
  const [message, setMessage] = useState('Finding tasks near your saved profile location…');
  const [busy, setBusy] = useState('');
  async function load() {
    const response = await fetch('/api/tasks/radar'); const body = await response.json();
    if (!response.ok) { setMessage(body.error?.message ?? 'Unable to load nearby tasks.'); return; }
    setTasks(body.tasks); setMessage(body.tasks.length ? '' : 'No tasks are available within 10 km yet. Check back soon.');
  }
  useEffect(() => { void load(); }, []);
  async function claim(id: string) {
    setBusy(id);
    const response = await fetch(`/api/tasks/${id}/claim`, { method: 'POST' }); const body = await response.json();
    setBusy('');
    if (!response.ok) { setMessage(body.error?.message ?? 'Unable to claim this task.'); return; }
    window.location.assign(`/tasks/${id}`);
  }
  return <main className="mx-auto max-w-3xl space-y-5">
    <header className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-[#0e6b53]">Runner radar · 10 km</p><h1 className="mt-2 text-2xl font-bold text-[#16241d]">Nearby tasks</h1><p className="mt-1 text-sm text-[#68766e]">Tasks are matched using the approximate location saved to your profile.</p></div><Link href="/tasks/new" className="rounded-lg bg-[#0e6b53] px-4 py-2.5 text-sm font-semibold text-white">Post a task</Link></header>
    {message && <p role="status" className="rounded-xl bg-white p-5 text-sm text-[#68766e]">{message}</p>}
    <div className="space-y-3">{tasks.map((task) => <article key={task.id} className="space-y-3 rounded-2xl border border-[#e2e9e5] bg-white p-5">
      <div className="flex items-start justify-between gap-4"><div><span className="text-xs font-semibold text-[#0e6b53]">{task.category.replaceAll('_', ' ')}</span><h2 className="mt-1 text-lg font-bold text-[#16241d]">{task.title}</h2><p className="mt-1 text-sm text-[#68766e]">{task.pickupArea} · {task.distanceKm} km away</p></div><strong className="shrink-0 text-sm text-[#16241d]">{money(task.runnerFee)}</strong></div>
      {task.description && <p className="text-sm text-[#536158]">{task.description}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#edf1ee] pt-3 text-xs text-[#68766e]"><span>Estimated expenses: {money(task.estimatedExpenses)} · {task.settlementMethod.replaceAll('_', ' ')}</span><button disabled={busy === task.id} onClick={() => void claim(task.id)} className="rounded-lg bg-[#0e6b53] px-4 py-2.5 font-semibold text-white disabled:opacity-50">{busy === task.id ? 'Claiming…' : 'Claim task'}</button></div>
    </article>)}</div>
  </main>;
}
