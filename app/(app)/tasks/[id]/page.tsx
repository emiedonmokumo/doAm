'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';

type Task = { id: string; title: string; description: string | null; category: string; runner_fee: number; estimated_expenses: number; settlement_method: string; status: string; pickup_area: string; pickup_city: string; pickup_region: string; dropoff_area: string | null; dropoff_city: string | null; dropoff_region: string | null; proof_url: string | null; is_poster: boolean; is_runner: boolean; conversation_id: string | null; can_rate: boolean; has_rated: boolean; rated_user_id: string | null; events: { type: string; createdAt: string }[] };
const labels: Record<string, string> = { POSTED: 'Waiting for a runner', CLAIMED: 'Runner claimed this task', EN_ROUTE_PICKUP: 'Runner is on the way to pickup', ARRIVED_PICKUP: 'Runner arrived at pickup', PROOF_SUBMITTED: 'Proof submitted', EN_ROUTE_DROPOFF: 'Runner is on the way to drop-off', ARRIVED_DROPOFF: 'Runner arrived at drop-off', COMPLETED: 'Task completed', CANCELLED: 'Task cancelled' };

export default function TaskPage() {
  const { id } = useParams<{ id: string }>();
  const [task, setTask] = useState<Task | null>(null);
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [pin, setPin] = useState(''); const [score, setScore] = useState(5); const [review, setReview] = useState('');
  async function load() {
    const response = await fetch(`/api/tasks/${id}`); const body = await response.json();
    if (!response.ok) { setError(body.error?.message ?? 'Unable to load this task.'); return; }
    setTask(body.task); setError('');
  }
  useEffect(() => { void load(); }, [id]);
  async function act(url: string, options: RequestInit) {
    setBusy(true); setError('');
    const response = await fetch(url, options); const body = await response.json(); setBusy(false);
    if (!response.ok) { setError(body.error?.message ?? 'Unable to update this task.'); return; }
    await load();
  }
  if (!task) return <p role="status" className="mx-auto max-w-2xl rounded-xl bg-white p-5 text-sm text-[#68766e]">{error || 'Loading task…'}</p>;
  const action = task.status === 'CLAIMED' ? 'EN_ROUTE_PICKUP' : task.status === 'EN_ROUTE_PICKUP' ? 'ARRIVED_PICKUP' : task.status === 'PROOF_SUBMITTED' && task.dropoff_area ? 'EN_ROUTE_DROPOFF' : task.status === 'EN_ROUTE_DROPOFF' ? 'ARRIVED_DROPOFF' : null;
  const proofNeeded = (task.category === 'PICKUP_DELIVERY' || task.category === 'QUICK_REPAIR') && task.status === 'ARRIVED_PICKUP';
  const canSettle = task.status === 'ARRIVED_DROPOFF' || (task.status === 'ARRIVED_PICKUP' && !proofNeeded) || (task.status === 'PROOF_SUBMITTED' && !task.dropoff_area);
  return <article className="mx-auto max-w-2xl space-y-5 rounded-2xl border border-[#e2e9e5] bg-white p-5 sm:p-7">
    <header><p className="text-xs font-bold uppercase tracking-wider text-[#0e6b53]">{task.category.replaceAll('_', ' ')}</p><h1 className="mt-2 text-2xl font-bold text-[#16241d]">{task.title}</h1><p role="status" className="mt-2 text-sm font-semibold text-[#0e6b53]">{labels[task.status] ?? task.status}</p>{task.description && <p className="mt-3 text-sm leading-6 text-[#536158]">{task.description}</p>}</header>
    <div className="grid gap-3 rounded-xl bg-[#f6f9f7] p-4 text-sm sm:grid-cols-2"><p><span className="text-[#68766e]">Runner fee</span><br /><strong>₦{task.runner_fee.toLocaleString()}</strong></p><p><span className="text-[#68766e]">Estimated expenses</span><br /><strong>₦{task.estimated_expenses.toLocaleString()}</strong></p><p><span className="text-[#68766e]">Handover instruction</span><br /><strong>{task.settlement_method.replaceAll('_', ' ')}</strong></p><p><span className="text-[#68766e]">Pickup</span><br /><strong>{task.pickup_area}, {task.pickup_city}</strong></p>{task.dropoff_area && <p><span className="text-[#68766e]">Drop-off</span><br /><strong>{task.dropoff_area}, {task.dropoff_city}</strong></p>}</div>
    {task.proof_url && <img src={task.proof_url} alt="Runner submitted task proof" className="max-h-96 w-full rounded-xl object-contain" />}
    {task.is_runner && action && <button disabled={busy} onClick={() => void act(`/api/tasks/${id}/events`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action }) })} className="w-full rounded-xl bg-[#0e6b53] px-4 py-3 font-semibold text-white disabled:opacity-50">{busy ? 'Updating…' : labels[action]}</button>}
    {task.is_runner && proofNeeded && <form className="space-y-2" onSubmit={(event) => { event.preventDefault(); const file = (event.currentTarget.elements.namedItem('proof') as HTMLInputElement).files?.[0]; if (!file) return; const data = new FormData(); data.set('proof', file); void act(`/api/tasks/${id}/proof`, { method: 'POST', body: data }); }}><label className="block text-sm font-semibold" htmlFor="proof">Add proof photo (JPEG, PNG, or WebP; up to 5 MB)</label><input id="proof" name="proof" type="file" accept="image/jpeg,image/png,image/webp" required className="block w-full text-sm" /><button disabled={busy} className="w-full rounded-xl border border-[#0e6b53] px-4 py-3 font-semibold text-[#0e6b53]">{busy ? 'Uploading…' : 'Submit proof'}</button></form>}
    {task.is_runner && canSettle && <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); void act(`/api/tasks/${id}/settle`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ pin }) }); }}><input aria-label="Handover PIN" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} required value={pin} onChange={(event) => setPin(event.target.value)} placeholder="4-digit handover PIN" className="min-w-0 flex-1 rounded-xl border border-[#dce5df] px-3" /><button disabled={busy} className="rounded-xl bg-[#0e6b53] px-4 py-3 text-sm font-semibold text-white">{busy ? 'Checking…' : 'Confirm handover'}</button></form>}
    {task.conversation_id && (task.is_poster || task.is_runner) && <Link href={`/messages?task=${task.id}`} className="block rounded-xl border border-[#0e6b53] px-4 py-3 text-center text-sm font-semibold text-[#0e6b53]">Open task chat</Link>}
    {task.can_rate && !task.has_rated && <form className="space-y-3 border-t border-[#edf1ee] pt-4" onSubmit={(event) => { event.preventDefault(); void act(`/api/tasks/${id}/ratings`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ score, review }) }); }}><h2 className="text-sm font-bold">Rate your task partner</h2><div className="flex gap-3"><select aria-label="Rating" value={score} onChange={(event) => setScore(Number(event.target.value))} className="rounded-lg border border-[#dce5df] px-3"><option value={5}>5 stars</option><option value={4}>4 stars</option><option value={3}>3 stars</option><option value={2}>2 stars</option><option value={1}>1 star</option></select><input aria-label="Review (optional)" value={review} onChange={(event) => setReview(event.target.value)} maxLength={1000} placeholder="Leave a short review" className="min-w-0 flex-1 rounded-lg border border-[#dce5df] px-3" /><button disabled={busy} className="rounded-lg bg-[#0e6b53] px-4 py-2 text-sm font-semibold text-white">Submit rating</button></div></form>}
    {task.has_rated && <p className="border-t border-[#edf1ee] pt-4 text-sm text-[#68766e]">You have rated your task partner.</p>}
    {error && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
    <section><h2 className="text-sm font-bold">Task updates</h2><ol className="mt-2 space-y-2">{task.events.map((event, index) => <li key={`${event.type}-${index}`} className="flex justify-between gap-4 text-xs text-[#68766e]"><span>{labels[event.type] ?? event.type}</span><time dateTime={event.createdAt}>{format(parseISO(event.createdAt), 'PPp')}</time></li>)}</ol></section>
  </article>;
}
