'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { formatISO } from 'date-fns';
import { Bell, Check, Loader2 } from 'lucide-react';
import { formatTimeAgo } from '@/lib/utils';

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  entity_id: string | null;
  read_at: string | null;
  created_at: string;
};

function notificationHref(item: Notification) {
  return item.entity_id && item.type.startsWith('TASK_') ? `/tasks/${item.entity_id}` : '#';
}

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const response = await fetch('/api/notifications');
    const body = await response.json().catch(() => null);
    setItems(response.ok ? body.notifications : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function mark(id?: string) {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(id ? { id } : {}),
    });
    setItems((current) => current.map((item) =>
      !id || item.id === id ? { ...item, read_at: formatISO(new Date()) } : item,
    ));
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-[#0e6b53]" /></div>;
  }

  const unread = items.filter((item) => !item.read_at).length;

  return (
    <div className="mx-auto max-w-[560px]">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Notifications</h1>
          {unread > 0 && <p className="mt-1 text-sm text-[#6b7280]">{unread} unread</p>}
        </div>
        {unread > 0 && (
          <button onClick={() => void mark()} className="flex items-center gap-1.5 rounded-xl border border-[#e2e9e5] bg-white px-3 py-2 text-xs font-semibold text-[#0e6b53]">
            <Check className="h-3.5 w-3.5" />Mark all read
          </button>
        )}
      </div>
      {items.length ? (
        <div className="space-y-2">
          {items.map((item) => (
            <Link
              key={item.id}
              href={notificationHref(item)}
              onClick={() => !item.read_at && void mark(item.id)}
              className={`block rounded-xl border p-4 ${item.read_at ? 'border-[#eef0ee] bg-white' : 'border-[#c8ded4] bg-[#f0f7f3]'}`}
            >
              <p className="text-sm font-semibold text-[#27352e]">{item.title}</p>
              {item.body && <p className="mt-1 text-sm text-[#748079]">{item.body}</p>}
              <p className="mt-1 text-xs text-[#a0aaa5]">{formatTimeAgo(item.created_at)}</p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#cbdcd3] bg-white px-6 py-16 text-center">
          <Bell className="mx-auto mb-4 h-6 w-6 text-[#0e6b53]" />
          <h3 className="font-bold text-[#27352e]">No notifications yet</h3>
        </div>
      )}
    </div>
  );
}
