'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import apiClient from '@/lib/api';
import AppShell from '@/components/AppShell';
import AuthGuard from '@/components/AuthGuard';
import PageHeader from '@/components/ui/PageHeader';
import Badge from '@/components/ui/Badge';
import { Send, MessageSquare, Users, Loader2 } from 'lucide-react';

function isStaff(role) {
  return role && role !== 'tenant';
}

function timeLabel(value) {
  if (!value) return '';
  const date = new Date(value);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  return sameDay
    ? date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function DiscussionPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [conversations, setConversations] = useState([]);
  const [activeTenantId, setActiveTenantId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  const staff = isStaff(user?.role);

  const loadConversations = useCallback(async () => {
    try {
      const response = await apiClient.getConversations();
      if (response.success) {
        const list = response.data;
        setConversations(list);
        if (list.length && !activeTenantId) {
          setActiveTenantId(list[0].tenant_id);
        }
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
      toast.error('Unable to load conversations.');
    } finally {
      setLoading(false);
    }
  }, [activeTenantId, toast]);

  useEffect(() => {
    if (authLoading) return undefined;
    if (!isAuthenticated) {
      router.replace('/login');
      return undefined;
    }
    let active = true;

    const load = async () => {
      try {
        const response = await apiClient.getConversations();
        if (!active) return;
        if (response.success) {
          setConversations(response.data);
          if (response.data.length && !activeTenantId) {
            setActiveTenantId(response.data[0].tenant_id);
          }
        }
      } catch (error) {
        console.error('Failed to load conversations:', error);
        toast.error('Unable to load conversations.');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => { active = false; };
  }, [authLoading, isAuthenticated, router, activeTenantId, toast]);

  useEffect(() => {
    if (!activeTenantId) return undefined;
    let active = true;

    const load = async () => {
      setThreadLoading(true);
      try {
        const response = await apiClient.getConversationMessages(activeTenantId);
        if (active && response.success) setMessages(response.data);
      } catch (error) {
        console.error('Failed to load thread:', error);
        toast.error('Unable to load this conversation.');
      } finally {
        if (active) setThreadLoading(false);
      }
    };

    load();
    return () => { active = false; };
  }, [activeTenantId, toast]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const activeConversation = useMemo(
    () => conversations.find((c) => Number(c.tenant_id) === Number(activeTenantId)),
    [conversations, activeTenantId],
  );

  const selectConversation = (tenantId) => {
    setActiveTenantId(tenantId);
    setConversations((current) =>
      current.map((c) => (Number(c.tenant_id) === Number(tenantId) ? { ...c, unread_count: 0 } : c)),
    );
  };

  const submitMessage = async (event) => {
    event.preventDefault();
    const text = message.trim();
    if (!text || sending) return;

    setSending(true);
    try {
      const response = await apiClient.createDiscussion(text, staff ? activeTenantId : null);
      if (response.success) {
        setMessages((current) => [...current, response.data]);
        setMessage('');
      }
    } catch (error) {
      console.error(error);
      toast.error('Message could not be sent.');
    } finally {
      setSending(false);
    }
  };

  if (authLoading || loading) {
    return (
      <AppShell>
        <main className="mx-auto max-w-[1400px] px-5 py-7 sm:px-8 sm:py-10">
          <PageHeader eyebrow="Communication" title="Discussion" description="Send a message to your property team and follow the conversation." />
          <div className="card mt-8 overflow-hidden">
            <div className="skeleton h-64 w-full" />
          </div>
        </main>
      </AppShell>
    );
  }

  if (!user) return null;

  return (
    <AuthGuard>
      <AppShell>
      <main className="mx-auto max-w-[1400px] px-5 py-7 sm:px-8 sm:py-10">
        <PageHeader
          eyebrow="Communication"
          title="Discussion"
          description={staff ? 'Respond to tenants across your properties from one inbox.' : 'Message your property team and follow the conversation.'}
        />

        <div className="card mt-8 flex min-h-[560px] flex-col overflow-hidden lg:flex-row">
          {/* Conversation list */}
          {staff && (
            <aside className="shrink-0 border-b border-slate-100 lg:w-80 lg:border-b-0 lg:border-r">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Users size={16} className="text-teal-600" />
                  Tenants
                </p>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                  {conversations.length}
                </span>
              </div>
              <div className="max-h-[420px] overflow-y-auto lg:max-h-none">
                {conversations.length === 0 ? (
                  <p className="p-5 text-sm text-slate-500">No tenants with conversations yet.</p>
                ) : (
                  conversations.map((conversation) => {
                    const active = Number(conversation.tenant_id) === Number(activeTenantId);
                    const last = conversation.last_message?.message || 'No messages yet';
                    return (
                      <button
                        key={conversation.tenant_id}
                        type="button"
                        onClick={() => selectConversation(conversation.tenant_id)}
                        className={`flex w-full items-center gap-3 px-5 py-4 text-left transition ${
                          active
                            ? 'border-l-[3px] border-teal-500 bg-teal-50/60'
                            : 'border-l-[3px] border-transparent hover:bg-slate-50'
                        }`}
                      >
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${active ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                          {conversation.tenant_name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2">
                            <span className="truncate text-sm font-semibold text-slate-900">{conversation.tenant_name}</span>
                            {conversation.unread_count > 0 && (
                              <span className="rounded-full bg-teal-600 px-2 py-0.5 text-[10px] font-bold text-white">{conversation.unread_count}</span>
                            )}
                          </span>
                          <span className="block truncate text-xs text-slate-500">{last}</span>
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </aside>
          )}

          {/* Thread */}
          <section className="flex flex-1 flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-600">
                  {activeConversation?.tenant_name?.charAt(0)?.toUpperCase() || (staff ? '—' : user.name?.charAt(0)?.toUpperCase() || '?')}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {staff ? activeConversation?.tenant_name || 'Select a tenant' : 'Property team'}
                  </p>
                  <p className="text-xs text-slate-400">{staff ? 'Tenant conversation' : 'Replies from your property team'}</p>
                </div>
              </div>
              <Badge variant="teal">Direct</Badge>
            </div>

            <div ref={listRef} className="max-h-[420px] flex-1 space-y-4 overflow-y-auto px-5 py-5 lg:max-h-none">
              {threadLoading ? (
                <div className="flex items-center justify-center py-12 text-slate-400">
                  <Loader2 size={20} className="animate-spin" />
                </div>
              ) : !staff && !messages.length ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50 py-12 text-center">
                  <MessageSquare size={28} className="text-slate-300" />
                  <p className="mt-3 text-sm font-semibold text-slate-600">No messages yet</p>
                  <p className="mt-1 max-w-xs text-xs text-slate-400">Start the conversation — your property team will reply here.</p>
                </div>
              ) : staff && !activeTenantId ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50 py-12 text-center">
                  <Users size={28} className="text-slate-300" />
                  <p className="mt-3 text-sm font-semibold text-slate-600">Select a tenant</p>
                  <p className="mt-1 max-w-xs text-xs text-slate-400">Choose a conversation from the list to view the thread.</p>
                </div>
              ) : (
                messages.map((item) => {
                  const mine = item.sender_id === user.id;
                  return (
                    <div key={item.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 ${
                        mine
                          ? 'rounded-br-sm bg-teal-600 text-white'
                          : 'rounded-bl-sm bg-slate-100 text-slate-800'
                      }`}>
                        {!mine && <p className="mb-1 text-[11px] font-semibold text-teal-700">{item.sender?.name}</p>}
                        <p className="whitespace-pre-wrap text-sm leading-6">{item.message}</p>
                        <p className={`mt-1 text-right text-[10px] ${mine ? 'text-teal-100' : 'text-slate-400'}`}>
                          {timeLabel(item.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={submitMessage} className="border-t border-slate-100 bg-slate-50/60 p-4">
              <div className="flex items-end gap-3">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={2}
                  placeholder={staff && !activeTenantId ? 'Select a tenant conversation to reply...' : 'Type your message...'}
                  disabled={staff && !activeTenantId}
                  className="field-input flex-1 resize-none bg-white"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      submitMessage(e);
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={!message.trim() || sending || (staff && !activeTenantId)}
                  className="btn btn-primary px-4"
                >
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-400">Press Enter to send, Shift + Enter for a new line.</p>
            </form>
          </section>
        </div>
      </main>
    </AppShell>
    </AuthGuard>
  );
}