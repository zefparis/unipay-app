'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send, MessageCircle, AlertCircle, Headphones } from 'lucide-react';
import { wT } from '@/lib/i18n-wallet';

interface Conversation {
  id: string;
  status: 'open' | 'escalated' | 'resolved';
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  role: 'wallet' | 'bot' | 'admin';
  content: string;
  channel?: string;
  created_at: string;
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function statusColor(status: string): string {
  if (status === 'open') return 'bg-green-100 text-green-700';
  if (status === 'escalated') return 'bg-amber-100 text-amber-700';
  return 'bg-gray-100 text-gray-500';
}

export default function WalletSupportPage() {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  const T = wT(locale ?? 'fr');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/wallet/support/conversations');
      if (res.status === 401) { router.replace(`/${locale}/wallet/login`); return; }
      if (!res.ok) { setError(T.support_error); return; }
      const data = await res.json();
      const convs: Conversation[] = data.data ?? [];
      setConversations(convs);
      // Auto-select the most recent conversation if none selected
      if (convs.length > 0 && !activeId) {
        setActiveId(convs[0].id);
      }
    } catch {
      setError(T.support_error);
    } finally {
      setLoading(false);
    }
  }, [locale, router, T, activeId]);

  useEffect(() => { void loadConversations(); }, [loadConversations]);

  const loadMessages = useCallback(async (convId: string) => {
    setLoadingMsgs(true);
    try {
      const res = await fetch(`/api/wallet/support/conversations/${convId}/messages`);
      if (!res.ok) { setError(T.support_error); return; }
      const data = await res.json();
      setMessages(data.messages ?? []);
    } catch {
      setError(T.support_error);
    } finally {
      setLoadingMsgs(false);
    }
  }, [T]);

  useEffect(() => {
    if (activeId) void loadMessages(activeId);
    else setMessages([]);
  }, [activeId, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || sending) return;
    setSending(true);
    setError('');
    const msg = input.trim();
    setInput('');

    // Optimistic: add user message immediately
    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [...prev, {
      id: tempId,
      role: 'wallet',
      content: msg,
      channel: 'chat',
      created_at: new Date().toISOString(),
    }]);

    try {
      const res = await fetch('/api/wallet/support/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: activeId, message: msg }),
      });
      if (res.status === 401) { router.replace(`/${locale}/wallet/login`); return; }
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? T.support_error);
        return;
      }
      const data = await res.json();
      // Set active conversation if it was newly created
      if (!activeId && data.conversation_id) {
        setActiveId(data.conversation_id);
        void loadConversations();
      }
      // Add bot reply
      setMessages((prev) => [...prev, {
        id: `bot-${Date.now()}`,
        role: 'bot',
        content: data.reply ?? '',
        channel: 'chat',
        created_at: new Date().toISOString(),
      }]);
      // Update conversation status in list
      if (data.status === 'escalated') {
        setConversations((prev) => prev.map((c) =>
          c.id === data.conversation_id ? { ...c, status: 'escalated' } : c
        ));
      }
    } catch {
      setError(T.support_error);
    } finally {
      setSending(false);
    }
  }

  function startNewConversation() {
    setActiveId(null);
    setMessages([]);
  }

  const activeConv = conversations.find((c) => c.id === activeId);
  const isResolved = activeConv?.status === 'resolved';

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f172a] transition-colors duration-200">
      <div className="w-full max-w-md mx-auto min-h-screen flex flex-col pb-16">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-6 pb-4 border-b border-gray-100 dark:border-slate-700">
          <Link href={`/${locale}/wallet`} className="p-1 -ml-1 text-gray-600 dark:text-slate-300">
            <ArrowLeft size={22} />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#00A651]/10 flex items-center justify-center">
              <Headphones size={18} className="text-[#00A651]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">{T.support_title}</h1>
              <p className="text-xs text-gray-500 dark:text-slate-400">{T.support_subtitle}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mx-4 mt-3 rounded-xl bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Conversation list (horizontal scroll on mobile) */}
        {conversations.length > 0 && (
          <div className="px-4 pt-3">
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
              <button
                onClick={startNewConversation}
                className={`flex-shrink-0 rounded-xl border-2 px-3 py-1.5 text-xs font-semibold transition ${
                  !activeId
                    ? 'border-[#00A651] bg-[#00A651]/10 text-[#00A651]'
                    : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400'
                }`}
              >
                + {T.support_new}
              </button>
              {conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={`flex-shrink-0 rounded-xl border-2 px-3 py-1.5 text-xs font-semibold transition ${
                    activeId === c.id
                      ? 'border-[#00A651] bg-[#00A651]/10 text-[#00A651]'
                      : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400'
                  }`}
                >
                  <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${statusColor(c.status)}`} />
                  {new Date(c.updated_at).toLocaleDateString([], { day: '2-digit', month: 'short' })}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <svg className="animate-spin h-6 w-6 text-[#00A651]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : loadingMsgs ? (
            <div className="flex justify-center py-8">
              <svg className="animate-spin h-5 w-5 text-[#00A651]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageCircle size={40} className="text-gray-300 dark:text-slate-600 mb-3" />
              <p className="text-sm text-gray-400 dark:text-slate-500">{T.support_no_conv}</p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{T.support_subtitle}</p>
            </div>
          ) : (
            <>
              {activeConv?.status === 'escalated' && (
                <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-700 dark:text-amber-400 text-center">
                  {T.support_escalated}
                </div>
              )}
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === 'wallet' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                      m.role === 'wallet'
                        ? 'bg-[#00A651] text-white rounded-br-sm'
                        : m.role === 'admin'
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-200 rounded-bl-sm'
                        : 'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 rounded-bl-sm'
                    }`}
                  >
                    {m.role !== 'wallet' && (
                      <p className="text-xs font-semibold mb-0.5 opacity-60">
                        {m.role === 'admin' ? T.support_admin : T.support_bot}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                    <p className={`text-xs mt-1 ${m.role === 'wallet' ? 'text-white/60' : 'opacity-40'}`}>
                      {fmtTime(m.created_at)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-gray-100 dark:border-slate-700 px-4 py-3 bg-white dark:bg-[#0f172a]">
          {isResolved ? (
            <p className="text-center text-sm text-gray-400 dark:text-slate-500 py-2">{T.support_resolved}</p>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend(); } }}
                placeholder={T.support_placeholder}
                disabled={sending}
                className="flex-1 border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-[#00A651] focus:ring-2 focus:ring-[#00A651]/20 transition"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="w-12 h-12 flex-shrink-0 rounded-xl bg-[#00A651] text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition hover:bg-[#008F47]"
              >
                {sending ? (
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <Send size={18} />
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
