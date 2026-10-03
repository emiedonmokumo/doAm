'use client';

import Link from 'next/link';
import { List, Map as MapIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FeedMap, type FeedMapPoint } from '@/components/feed-map';

type NearbyTask = { id: string; title: string; description: string | null; category: string; runnerFee: number; estimatedExpenses: number; settlementMethod: string; pickupArea: string; pickupCity: string; pickupRegion: string; approximateLatitude: number; approximateLongitude: number; distanceKm: number };
const money = (value: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value);

export default function RadarPage() {
  const [tasks, setTasks] = useState<NearbyTask[]>([]);
  const [nearbyUsers, setNearbyUsers] = useState<FeedMapPoint[]>([]);
  const [center, setCenter] = useState<FeedMapPoint | null>(null);
  const [message, setMessage] = useState('Finding tasks near your saved profile location…');
  const [busy, setBusy] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'map' | 'list'>('map');
  async function load() {
    const response = await fetch('/api/tasks/radar'); const body = await response.json();
    if (!response.ok) { setMessage(body.error?.message ?? 'Unable to load nearby tasks.'); return; }
    setTasks(body.tasks); setNearbyUsers(body.nearbyUsers ?? []); setCenter(body.userLocation ?? null);
    setMessage(body.tasks.length ? '' : 'No tasks are available within 10 km yet. Check back soon.');
  }
  useEffect(() => { void load(); }, []);
  async function claim(id: string) {
    setBusy(id);
    const response = await fetch(`/api/tasks/${id}/claim`, { method: 'POST' }); const body = await response.json();
    setBusy('');
    if (!response.ok) { setMessage(body.error?.message ?? 'Unable to claim this task.'); return; }
    window.location.assign(`/tasks/${id}`);
  }
  const toggleClass = (active: boolean) => `flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition ${active ? 'bg-white text-[#0e6b53] shadow-sm' : 'text-[#68766e]'}`;
  return <div className="w-full space-y-5">
    <header className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-[#0e6b53]">Runner radar · 10 km</p><h1 className="mt-2 text-2xl font-bold text-[#16241d]">Nearby tasks</h1><p className="mt-1 text-sm text-[#68766e]">Tasks are matched using the approximate location saved to your profile.</p></div><Link href="/tasks/new" className="rounded-lg bg-[#0e6b53] px-4 py-2.5 text-sm font-semibold text-white">Post a task</Link></header>
    <div className="flex gap-1 rounded-xl bg-[#e8eeea] p-1 lg:hidden" role="tablist" aria-label="Radar view">
      <button type="button" role="tab" aria-selected={mobileView === 'map'} onClick={() => setMobileView('map')} className={toggleClass(mobileView === 'map')}><MapIcon className="h-4 w-4" />Map</button>
      <button type="button" role="tab" aria-selected={mobileView === 'list'} onClick={() => setMobileView('list')} className={toggleClass(mobileView === 'list')}><List className="h-4 w-4" />List · {tasks.length}</button>
    </div>
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1.6fr)_minmax(380px,1fr)] lg:gap-6">
      <FeedMap center={center} tasks={tasks} nearbyUsers={nearbyUsers} selectedTaskId={selectedTaskId} onSelectTask={setSelectedTaskId} className={`h-[60vh] min-h-[360px] lg:sticky lg:top-8 lg:block lg:h-[calc(100vh-12rem)] ${mobileView === 'map' ? 'block' : 'hidden'}`} />
      <section className={`space-y-3 lg:block ${mobileView === 'list' ? 'block' : 'hidden'}`} aria-label="Nearby task list">
        {message && <p role="status" className="rounded-xl bg-white p-5 text-sm text-[#68766e]">{message}</p>}
        {tasks.map((task) => <article key={task.id} onMouseEnter={() => setSelectedTaskId(task.id)} className={`space-y-3 rounded-2xl border bg-white p-5 transition ${selectedTaskId === task.id ? 'border-[#0e6b53] shadow-[0_6px_18px_rgba(14,107,83,0.12)]' : 'border-[#e2e9e5]'}`}>
          <div className="flex items-start justify-between gap-4"><div><span className="text-xs font-semibold text-[#0e6b53]">{task.category.replaceAll('_', ' ')}</span><h2 className="mt-1 text-lg font-bold text-[#16241d]"><Link href={`/tasks/${task.id}`} className="hover:underline">{task.title}</Link></h2><p className="mt-1 text-sm text-[#68766e]">{task.pickupArea} · {task.distanceKm} km away</p></div><strong className="shrink-0 text-sm text-[#16241d]">{money(task.runnerFee)}</strong></div>
          {task.description && <p className="text-sm text-[#536158]">{task.description}</p>}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#edf1ee] pt-3 text-xs text-[#68766e]"><span>Estimated expenses: {money(task.estimatedExpenses)} · {task.settlementMethod.replaceAll('_', ' ')}</span><div className="flex gap-2"><button type="button" onClick={() => { setSelectedTaskId(task.id); setMobileView('map'); }} className="rounded-lg border border-[#e2e9e5] px-3 py-2.5 font-semibold text-[#0e6b53] lg:hidden">Show on map</button><button disabled={busy === task.id} onClick={() => void claim(task.id)} className="rounded-lg bg-[#0e6b53] px-4 py-2.5 font-semibold text-white disabled:opacity-50">{busy === task.id ? 'Claiming…' : 'Claim task'}</button></div></div>
        </article>)}
      </section>
    </div>
  </div>;
}
