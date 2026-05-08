import { useMemo, useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { auth } from '../firebase/config';

const formatThreadTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export default function DirectMessagesModal() {
  const {
    dmThreads,
    isDmOpen,
    activeDmThreadId,
    closeDm,
    setActiveDmThread,
    sendDmMessage,
  } = useApp();
  const [draftMessage, setDraftMessage] = useState('');
  const messagesEndRef = useRef(null);
  const currentUserId = auth.currentUser?.uid;

  const sortedThreads = useMemo(
    () => {
      const sorted = [...dmThreads].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      console.log('💬 DM Modal - Sorted threads:', sorted.length);
      return sorted;
    },
    [dmThreads]
  );

  const activeThread =
    sortedThreads.find((thread) => thread.id === activeDmThreadId) || sortedThreads[0] || null;
  
  console.log('💬 DM Modal - Active thread:', activeThread?.id, 'Messages:', activeThread?.messages?.length || 0);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread?.messages]);

  if (!isDmOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeDm} />

      <div
        className="relative w-full max-w-6xl h-[88vh] bg-white rounded-2xl shadow-2xl border border-slate-200"
        style={{ padding: '24px', maxWidth: '100%', overflow: 'hidden', boxSizing: 'border-box', minWidth: 0 }}
      >
        <div className="flex h-full rounded-xl overflow-hidden border border-slate-100" style={{ minWidth: 0, overflow: 'hidden' }}>
        <aside className="w-[300px] border-r border-slate-200 bg-slate-50/80 flex flex-col" style={{ minWidth: 0, overflow: 'hidden' }}>
          <div className="px-4 py-3 border-b border-slate-200 bg-white">
            <div className="flex items-center justify-between" style={{ minWidth: 0, overflow: 'hidden' }}>
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700" style={{ wordBreak: 'break-word', overflowWrap: 'break-word', minWidth: 0 }}>
                Threads
              </h2>
              <button
                type="button"
                onClick={closeDm}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                style={{ minWidth: 0, overflow: 'hidden' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto p-2 space-y-1.5" style={{ overflowY: 'auto', overflowX: 'hidden', minWidth: 0 }}>
            {sortedThreads.length > 0 ? (
              sortedThreads.map((thread) => {
                const lastMessage = thread.messages[thread.messages.length - 1];
                const isActive = activeThread?.id === thread.id;
                return (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => setActiveDmThread(thread.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all ${
                      isActive ? 'bg-white border border-indigo-200 shadow-sm' : 'hover:bg-white'
                    }`}
                    style={{ padding: '12px 14px', minWidth: 0, overflow: 'hidden' }}
                  >
                    <div className="flex items-start gap-3" style={{ gap: '12px', minWidth: 0, overflow: 'hidden' }}>
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {thread.participant.avatar}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className="text-sm font-semibold text-slate-800 truncate"
                            style={{
                              wordBreak: 'break-word',
                              overflowWrap: 'break-word',
                              minWidth: 0,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '100%',
                              display: 'block',
                            }}
                          >
                            {thread.participant.name}
                          </p>
                          <span
                            className="text-xs text-slate-400 shrink-0"
                            style={{
                              wordBreak: 'break-word',
                              overflowWrap: 'break-word',
                              minWidth: 0,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '100%',
                              display: 'block',
                            }}
                          >
                            {formatThreadTimestamp(thread.updatedAt)}
                          </span>
                        </div>
                        <p
                          className="text-xs text-slate-500 truncate mt-0.5"
                          style={{
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word',
                            minWidth: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '100%',
                            display: 'block',
                          }}
                        >
                          {lastMessage ? lastMessage.text : 'No messages yet'}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
                  <MessageCircle className="w-8 h-8" />
                </div>
                <p className="text-sm text-slate-600 font-medium" style={{ wordBreak: 'break-word', overflowWrap: 'break-word', minWidth: 0 }}>
                  No conversations yet
                </p>
                <p className="text-xs text-slate-400 mt-1" style={{ wordBreak: 'break-word', overflowWrap: 'break-word', minWidth: 0 }}>
                  Click on a user's profile to start a conversation
                </p>
              </div>
            )}
          </div>
        </aside>

        <section className="flex-1 flex flex-col min-w-0" style={{ minWidth: 0, overflow: 'hidden' }}>
          {activeThread ? (
            <>
              <div className="px-5 py-3 border-b border-slate-200 bg-white flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center text-sm font-bold shrink-0">
                    {activeThread.participant.avatar}
                  </div>
                  <div className="min-w-0">
                    <h3
                      className="text-base font-bold text-slate-800 truncate"
                      style={{
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '100%',
                        display: 'block',
                      }}
                    >
                      {activeThread.participant.name}
                    </h3>
                    <p
                      className="text-xs text-slate-500 truncate"
                      style={{
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '100%',
                        display: 'block',
                      }}
                    >
                      {activeThread.participant.bio}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 bg-white" style={{ overflowY: 'auto', overflowX: 'hidden', minWidth: 0 }}>
                {activeThread.messages.length > 0 ? (
                  <div className="space-y-4">
                    {activeThread.messages.map((message) => {
                      const isYou = message.senderId === currentUserId;
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isYou ? 'justify-end' : 'justify-start'}`}
                          style={{ minWidth: 0, overflow: 'hidden' }}
                        >
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                              isYou
                                ? 'bg-indigo-600 text-white rounded-br-md'
                                : 'bg-slate-100 text-slate-800 rounded-bl-md'
                            }`}
                            style={{ padding: '11px 15px', maxWidth: '68%', lineHeight: '1.55', minWidth: 0, overflow: 'hidden' }}
                          >
                            {!isYou && (
                              <p className="text-xs font-semibold text-slate-500 mb-1" style={{ wordBreak: 'break-word', overflowWrap: 'break-word', minWidth: 0 }}>
                                {message.sender}
                              </p>
                            )}
                            <p style={{ wordBreak: 'break-word', overflowWrap: 'break-word', minWidth: 0 }}>
                              {message.text}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-center">
                    <div>
                      <p className="text-sm text-slate-600 font-medium" style={{ wordBreak: 'break-word', overflowWrap: 'break-word', minWidth: 0 }}>
                        No messages yet
                      </p>
                      <p className="text-xs text-slate-400 mt-1" style={{ wordBreak: 'break-word', overflowWrap: 'break-word', minWidth: 0 }}>
                        Start the conversation with {activeThread.participant.name}.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!activeThread) return;
                  sendDmMessage(activeThread.id, draftMessage);
                  setDraftMessage('');
                }}
                className="p-4 border-t border-slate-200 bg-white"
                style={{ padding: '16px 24px', minWidth: 0, overflow: 'hidden' }}
              >
                <div className="flex items-center gap-3" style={{ minWidth: 0, overflow: 'hidden' }}>
                  <input
                    value={draftMessage}
                    onChange={(e) => setDraftMessage(e.target.value)}
                    placeholder="Write a message..."
                    className="flex-1 h-11 px-4 bg-slate-100 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    style={{ minWidth: 0, overflow: 'hidden', boxSizing: 'border-box' }}
                  />
                  <button
                    type="submit"
                    disabled={!draftMessage.trim()}
                    className="h-11 px-4 inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ minWidth: 0, overflow: 'hidden' }}
                  >
                    <Send className="w-4 h-4" />
                    <span
                      style={{
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '100%',
                        display: 'block',
                      }}
                    >
                      Send
                    </span>
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="h-full flex items-center justify-center bg-white text-slate-500">
              <div style={{ wordBreak: 'break-word', overflowWrap: 'break-word', minWidth: 0 }}>
                No conversations yet.
              </div>
            </div>
          )}
        </section>
        </div>
      </div>
    </div>
  );
}
