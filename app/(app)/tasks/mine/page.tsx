'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

type TaskSummary = {
  id: string;
  title: string;
  category: string;
  runner_fee: number;
  status: string;
  role: 'POSTER' | 'RUNNER';
  imageUrl?: string | null;
};

const money = (value: number) => new Intl.NumberFormat('en-NG', {
  style: 'currency', currency: 'NGN', maximumFractionDigits: 0,
}).format(value);

export default function MyTasksPage() {
  const [tasks, setTasks] = useState<TaskSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/tasks/mine')
      .then(async (response) => {
        if (!response.ok) throw new Error('Unable to load your tasks.');
        return response.json();
      })
      .then((body: { tasks: TaskSummary[] }) => setTasks(body.tasks))
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Unable to load your tasks.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-[#0e6b53]" /></div>;

  return (
    <main className="mx-auto max-w-3xl space-y-5">
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#0e6b53]">Your activity</p>
          <h1 className="mt-2 text-2xl font-bold text-[#16241d]">My tasks</h1>
        </div>
        <Link href="/tasks/new" className="rounded-lg bg-[#0e6b53] px-4 py-2.5 text-sm font-semibold text-white">Post a task</Link>
      </header>
      {error ? <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p> : tasks.length ? (
        <div className="space-y-3">
          {tasks.map((task) => (
            <Link key={task.id} href={`/tasks/${task.id}`} className="flex items-center justify-between gap-4 rounded-xl border border-[#e2e9e5] bg-white p-4 transition hover:border-[#0e6b53]/40">
              <div className="flex min-w-0 items-center gap-3">
                {task.imageUrl && (
                  <img src={task.imageUrl} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover ring-1 ring-[#e2e9e5]" />
                )}
                <div className="min-w-0">
                  <p className="truncate font-semibold text-[#16241d]">{task.title}</p>
                  <p className="mt-1 text-xs text-[#68766e]">{task.role === 'POSTER' ? 'Posted by you' : 'Claimed by you'} · {task.category.replaceAll('_', ' ')}</p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold text-[#0e6b53]">{money(task.runner_fee)}</p>
                <p className="mt-1 text-xs text-[#68766e]">{task.status.replaceAll('_', ' ')}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-[#cbdcd3] bg-white px-6 py-16 text-center">
          <h2 className="font-semibold text-[#27352e]">No tasks yet</h2>
          <p className="mt-1 text-sm text-[#68766e]">Tasks you post or claim will appear here.</p>
        </div>
      )}
    </main>
  );
}