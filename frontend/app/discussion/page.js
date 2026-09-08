'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Logo from '@/components/Logo';

export default function DiscussionPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    apiClient.getDiscussions().then((response) => {
      if (active && response.success) setMessages(response.data);
    }).catch((error) => console.error(error)).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  if (!user) return null;

  const submitMessage = async (event) => {
    event.preventDefault();
    if (!message.trim()) return;
    try {
      const response = await apiClient.createDiscussion(message);
      if (response.success) {
        setMessages((current) => [response.data, ...current]);
        setSent(true);
        setMessage('');
      }
    } catch (error) {
      console.error(error);
    }
  };

  return <div className="min-h-screen bg-[#f6f8fb] text-slate-900"><Header router={router} logout={logout} /><main className="mx-auto max-w-3xl px-5 py-8 sm:px-8"><p className="text-sm font-semibold text-teal-700">My account</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Discussion</h1><p className="mt-2 text-sm text-slate-500">Send a message to your property team and follow the conversation.</p><section className="mt-8 rounded-xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 p-5"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Conversation</p><div className="mt-3 space-y-3">{loading ? <p className="text-sm text-slate-500">Loading messages...</p> : messages.length ? messages.map((item) => <div key={item.id} className="rounded-lg bg-slate-50 p-4"><p className="text-sm leading-6 text-slate-700">{item.message}</p><p className="mt-2 text-xs text-slate-400">{item.sender?.name || 'You'}</p></div>) : <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">No messages yet. Start a conversation below.</p>}</div></div><form onSubmit={submitMessage} className="p-5"><label htmlFor="message" className="text-sm font-semibold text-slate-800">Your message</label><textarea id="message" value={message} onChange={(event) => setMessage(event.target.value)} rows="5" placeholder="Write your message here..." className="mt-3 block w-full resize-none rounded-lg border border-slate-200 px-3 py-3 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" /><div className="mt-4 flex items-center justify-between gap-4">{sent ? <p className="text-sm font-medium text-emerald-700">Message sent successfully.</p> : <span /> }<button className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700">Send message</button></div></form></section></main></div>;
}

function Header({ router, logout }) {
  return <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8"><button onClick={() => router.push('/dashboard')} aria-label="Back to dashboard"><Logo size="md" /></button><div className="flex items-center gap-4"><button onClick={() => router.push('/dashboard')} className="text-sm font-semibold text-slate-600 hover:text-slate-950">Back to dashboard</button><button onClick={logout} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:text-slate-950">Sign out</button></div></div></header>;
}
