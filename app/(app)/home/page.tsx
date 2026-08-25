'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Bookmark, Clock3, Heart, ListFilter, Loader2, MapPin, MapPinned, MessageCircle, Plus, Search, Tag, Users } from 'lucide-react';
import { doAmStatusLabel, formatNaira, formatTimeAgo, type DoAmWithCreator } from '@/lib/doam';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';

const categories = ['All', 'Errands', 'Delivery', 'Cleaning', 'Moving', 'Shopping', 'Household', 'Personal Help', 'Events', 'Repairs', 'Other'];

export default function HomePage() {
  const { profile } = useAuth();
  const [doams, setDoams] = useState<DoAmWithCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'feed' | 'map'>('feed');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const load = useCallback(async () => {
    setLoading(true); const query = new URLSearchParams({ take: '30' });
    if (search.trim()) query.set('search', search.trim()); if (category !== 'All') query.set('category', category);
    const response = await fetch(`/api/doams?${query}`, { cache: 'no-store' }); const body = await response.json().catch(() => null);
    setDoams(response.ok ? body.doams : []); setLoading(false);
  }, [category, search]);
  useEffect(() => { const timeout = setTimeout(load, 200); return () => clearTimeout(timeout); }, [load]);
  return <div><div className="mb-6"><h1 className="text-2xl font-bold tracking-[-0.03em] text-[#111827] lg:text-3xl">Hello, {profile?.full_name?.split(' ')[0] ?? 'there'}</h1><p className="mt-1 text-sm text-[#6b7280]">{doams.length ? `${doams.length} DoAms nearby right now` : 'Discover opportunities around you'}</p></div><div className="relative mb-5"><Search className="absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#8a9590]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search nearby DoAms" className="h-11 w-full rounded-xl border border-[#e4e9e6] bg-white pl-10 pr-4 text-sm outline-none focus:border-[#0e6b53] focus:ring-4 focus:ring-[#0e6b53]/10" /></div><div className="mb-5 flex items-center justify-between"><div className="flex rounded-xl border border-[#e4e9e6] bg-white p-1"><button onClick={() => setView('feed')} className={cn('flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold', view === 'feed' ? 'bg-[#edf7f2] text-[#0e6b53]' : 'text-[#8a9590]')}><ListFilter className="h-4 w-4" /> Feed</button><button onClick={() => setView('map')} className={cn('flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold', view === 'map' ? 'bg-[#edf7f2] text-[#0e6b53]' : 'text-[#8a9590]')}><MapPinned className="h-4 w-4" /> Area</button></div><Link href="/create" className="flex h-9 items-center gap-1.5 rounded-xl bg-[#0e6b53] px-4 text-xs font-semibold text-white"><Plus className="h-4 w-4" /> Post</Link></div><div className="mb-5 flex gap-2 overflow-x-auto pb-1 scrollbar-none">{categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={cn('whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold', category === item ? 'border-[#0e6b53] bg-[#0e6b53] text-white' : 'border-[#e1e8e4] bg-white text-[#6e7c74]')}>{item}</button>)}</div>{loading ? <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-[#0e6b53]" /></div> : view === 'map' ? <AreaView doams={doams} /> : doams.length ? <div className="space-y-4">{doams.map((doam) => <DoAmCard key={doam.id} doam={doam} />)}</div> : <EmptyState />}</div>;
}

function DoAmCard({ doam }: { doam: DoAmWithCreator }) {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [interestState, setInterestState] = useState<'idle' | 'sent'>('idle');
  const action = async () => {
    const name = saved ? 'unsave' : 'save';
    const response = await fetch(`/api/doams/${doam.id}/social`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: name }) });
    if (response.ok) setSaved(!saved);
  };
  const offerHelp = async () => {
    const response = await fetch(`/api/doams/${doam.id}/interest`, { method: 'POST' });
    if (response.ok) setInterestState('sent');
  };
  return (
    <Link href={`/doams/${doam.id}`} className="block">
      <article className="rounded-2xl border border-[#e4e9e6] bg-white p-5 transition hover:border-[#c8ded4] hover:shadow-[0_12px_30px_rgba(24,53,40,0.07)]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#d8f6ea] text-xs font-bold text-[#0e6b53]">{doam.creator?.full_name?.charAt(0)?.toUpperCase() ?? 'U'}</div><div><p className="text-sm font-semibold text-[#27352e]">{doam.creator?.full_name ?? 'Unknown'}</p><p className="mt-0.5 flex items-center gap-1 text-xs text-[#89958f]"><MapPin className="h-3 w-3" />{doam.location_label ?? 'Location set'}</p></div></div>
          <span className="rounded-full bg-[#edf7f2] px-2 py-1 text-[10px] font-bold text-[#0e6b53]">{doAmStatusLabel(doam.status)}</span>
        </div>
        <div className="mt-4"><div className="flex items-start justify-between gap-3"><h3 className="text-[17px] font-bold leading-snug text-[#17221c]">{doam.title}</h3><p className="text-lg font-bold text-[#0e6b53]">{formatNaira(doam.reward)}</p></div>{doam.description && <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#748079]">{doam.description}</p>}<div className="mt-3 flex flex-wrap gap-3 text-xs text-[#87938c]"><span className="flex items-center gap-1"><Tag className="h-3.5 w-3.5 text-[#0e6b53]" />{doam.category}</span>{doam.scheduled_date && <span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5 text-[#0e6b53]" />{new Date(doam.scheduled_date).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })}</span>}<span className="flex items-center gap-1 text-[#0e6b53]"><Users className="h-3.5 w-3.5" />{doam.interest_count ?? 0} can do this</span></div></div>
        <div className="mt-4 flex items-center justify-between border-t border-[#edf0ee] pt-3"><span className="text-xs text-[#a0aaa5]">{formatTimeAgo(doam.created_at)}</span><div className="flex items-center gap-2">{user?.id !== doam.creator_id && (doam.status === 'PUBLISHED' || (doam.is_multi_person && doam.status === 'ACCEPTED')) && <button onClick={(event) => { event.preventDefault(); offerHelp(); }} className="rounded-lg bg-[#0e6b53] px-3 py-2 text-xs font-bold text-white">{interestState === 'sent' ? 'OFFER SENT' : 'I CAN DO THIS'}</button>}<button onClick={(event) => { event.preventDefault(); action(); }} className={cn('rounded-lg p-2', saved ? 'bg-[#e9f7f0] text-[#0e6b53]' : 'text-[#98a39d]')}><Bookmark className={cn('h-[18px] w-[18px]', saved && 'fill-current')} /></button></div></div>
      </article>
    </Link>
  );
}
function AreaView({ doams }: { doams: DoAmWithCreator[] }) { return <div className="rounded-2xl border border-[#dbe9e2] bg-[#edf7f2] p-5"><p className="text-sm font-semibold text-[#27352e]">Nearby opportunities</p><p className="mt-1 text-xs text-[#6b7280]">Location labels are intentionally approximate. Configure Google Maps to enable the interactive map.</p><div className="mt-4 space-y-2">{doams.filter((item) => item.latitude != null).slice(0, 8).map((item) => <Link key={item.id} href={`/doams/${item.id}`} className="flex items-center justify-between rounded-xl bg-white p-3 text-sm"><span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[#0e6b53]" />{item.title}</span><span className="font-semibold text-[#0e6b53]">{item.location_label}</span></Link>)}</div></div>; }
function EmptyState() { return <div className="rounded-2xl border border-dashed border-[#cbdcd3] bg-white px-6 py-16 text-center"><Search className="mx-auto mb-4 h-6 w-6 text-[#0e6b53]" /><h3 className="font-bold text-[#27352e]">No DoAms found</h3><p className="mt-1 text-sm text-[#89958f]">Try another category or post the first DoAm in your area.</p></div>; }
