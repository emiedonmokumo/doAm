'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, MessageCircle, Send } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

type Conversation = {
  id: string;
  task_id: string;
  task_title: string;
  poster_id: string;
  runner_id: string;
  last_message: { content: string; created_at: string } | null;
};

type Message = { id: string; sender_id: string; content: string; created_at: string };
type Room = Omit<Conversation, 'last_message'> & { runner_fee: number; status: string };

export default function MessagesPage() {
  const { user } = useAuth();
  const search = useSearchParams();
  const requestedTaskId = search.get('task');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    const response = await fetch('/api/messages');
    const body = await response.json().catch(() => null);
    const list = response.ok ? body.conversations as Conversation[] : [];
    setConversations(list);
    setSelected((current) => list.find((item) => item.task_id === requestedTaskId) ?? current ?? list[0] ?? null);
    setLoading(false);
  }, [requestedTaskId]);

  const loadMessages = useCallback(async () => {
    if (!selected) return;
    const response = await fetch(`/api/messages?conversation=${selected.id}`);
    const body = await response.json().catch(() => null);
    if (response.ok) {
      setMessages(body.messages);
      setRoom(body.conversation);
    }
  }, [selected]);

  useEffect(() => { void loadConversations(); }, [loadConversations]);
  useEffect(() => { void loadMessages(); }, [loadMessages]);

  async function send() {
    if (!selected || !text.trim()) return;
    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation_id: selected.id, content: text.trim() }),
    });
    const body = await response.json().catch(() => null);
    if (response.ok) {
      setMessages((items) => [...items, body.message]);
      setText('');
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-[#0e6b53]" /></div>;

  return (
    <div className="grid min-h-[580px] overflow-hidden rounded-xl border border-[#e4e9e6] bg-white md:grid-cols-[280px_1fr]">
      <aside className="border-b border-[#e4e9e6] p-3 md:border-b-0 md:border-r">
        <h1 className="p-2 text-xl font-bold text-[#111827]">Task chats</h1>
        {conversations.length ? conversations.map((item) => (
          <button key={item.id} onClick={() => setSelected(item)} className={`w-full rounded-xl p-3 text-left ${selected?.id === item.id ? 'bg-[#edf7f2]' : 'hover:bg-[#f7faf8]'}`}>
            <p className="truncate text-sm font-semibold text-[#27352e]">{item.task_title}</p>
            <p className="mt-1 truncate text-xs text-[#89958f]">{item.last_message?.content ?? 'Start coordinating'}</p>
          </button>
        )) : <p className="p-3 text-sm text-[#89958f]">A task chat opens when a runner claims a task.</p>}
      </aside>
      <section className="flex min-h-[460px] flex-col">
        {selected ? <>
          <div className="border-b border-[#e4e9e6] p-4">
            <p className="font-semibold text-[#27352e]">{room?.task_title ?? selected.task_title}</p>
            {room && <p className="mt-1 text-xs text-[#6b7280]">₦{room.runner_fee.toLocaleString('en-NG')} · {room.status.replaceAll('_', ' ')}</p>}
          </div>
          <div className="flex-1 space-y-3 p-4">
            {messages.map((item) => <div key={item.id} className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${item.sender_id === user?.id ? 'ml-auto bg-[#0e6b53] text-white' : 'bg-[#edf0ee] text-[#27352e]'}`}>{item.content}</div>)}
          </div>
          <form onSubmit={(event) => { event.preventDefault(); void send(); }} className="flex gap-2 border-t border-[#e4e9e6] p-3">
            <input value={text} onChange={(event) => setText(event.target.value)} placeholder="Message about this task" className="h-10 flex-1 rounded-lg border border-[#dce5df] px-3 text-sm" />
            <button aria-label="Send message" className="rounded-lg bg-[#0e6b53] px-3 text-white"><Send className="h-4 w-4" /></button>
          </form>
        </> : <div className="m-auto text-center text-sm text-[#89958f]"><MessageCircle className="mx-auto mb-2 h-6 w-6" />Choose a task chat</div>}
      </section>
    </div>
  );
}
