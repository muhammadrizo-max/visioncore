import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Send,
  Paperclip,
  Mic,
  Square,
  Play,
  Pause,
  Users,
  Lock,
  Image as ImageIcon,
  Search,
  MessageCircle,
  X,
  ChevronLeft,
} from 'lucide-react';
import { User, ChatMessage } from '../types';
import { api, apiPost, getToken } from '../lib/api';

interface ChatViewProps {
  currentUser: User;
  allUsers: User[];
  chats: ChatMessage[];
  onSendMessage: (msg: ChatMessage) => void;
  onEditMessage: (msgId: string, newText: string) => void;
  onDeleteMessage: (msgId: string) => void;
  darkMode: boolean;
}

interface TypingUser {
  userId: string;
  userName: string;
  status: 'typing' | 'recording';
}

function getCanonicalDmChatId(idA: string, idB: string): string {
  return `direct::${[idA, idB].sort().join('::')}`;
}

function extractDmParticipants(chatId: string): [string, string] | null {
  if (!chatId) return null;
  if (chatId.startsWith('direct::')) {
    const parts = chatId.slice(8).split('::').filter(Boolean);
    if (parts.length === 2) return [parts[0], parts[1]];
  }
  if (chatId.startsWith('direct_')) {
    const body = chatId.slice(7);
    // Match both vcg-12345678 and vcg_12345678 without breaking on underscores inside IDs
    const matches = body.match(/vcg[-_]\d+/gi);
    if (matches && matches.length === 2) {
      return [matches[0], matches[1]];
    }
    const rawParts = body.split('_').filter(Boolean);
    if (rawParts.length === 2) {
      return [rawParts[0], rawParts[1]];
    }
  }
  return null;
}

function getMessageOrderTs(msg: ChatMessage): number {
  if (msg.createdAt) {
    const parsed = Date.parse(msg.createdAt);
    if (!Number.isNaN(parsed)) return parsed;
  }
  const match = msg.id.match(/(\d{13})/);
  if (match) return Number(match[1]);
  return 0;
}

export const ChatView: React.FC<ChatViewProps> = ({
  currentUser,
  allUsers,
  chats,
  onSendMessage,
}) => {
  const [selectedChatId, setSelectedChatId] = useState<string>('general');
  const [mobileView, setMobileView] = useState<'chat' | 'list'>('chat');
  const [openedDmIds, setOpenedDmIds] = useState<string[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [attachmentUrl, setAttachmentUrl] = useState<string>('');

  // Voice recording state
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  // Live typing / recording presence from other users
  const [activeTypers, setActiveTypers] = useState<TypingUser[]>([]);

  // Search User modal state
  const [showSearchModal, setShowSearchModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const chatsRef = useRef<ChatMessage[]>(chats);
  chatsRef.current = chats;
  const onSendMessageRef = useRef(onSendMessage);
  onSendMessageRef.current = onSendMessage;
  const selectedChatIdRef = useRef(selectedChatId);
  selectedChatIdRef.current = selectedChatId;

  const typingIdleTimerRef = useRef<any>(null);
  const lastTypingPingRef = useRef<number>(0);

  const currentChatKey =
    selectedChatId === 'general'
      ? 'general'
      : getCanonicalDmChatId(currentUser.id, selectedChatId);

  const currentUserDisplayName =
    `${currentUser.firstName || currentUser.username} ${currentUser.lastName || ''}`.trim();

  // Broadcast typing / recording state helper
  const sendPresenceSignal = (status: 'typing' | 'recording' | 'idle', targetChatKey = currentChatKey) => {
    if (getToken()) {
      void apiPost('/api/chats/presence', {
        chatId: targetChatKey,
        status,
        userName: currentUserDisplayName,
      }).catch(() => {});
    }
    try {
      const bc = new BroadcastChannel('visioncore_live_chats');
      bc.postMessage({
        type: 'PRESENCE',
        chatKey: targetChatKey,
        userId: currentUser.id,
        userName: currentUserDisplayName,
        status,
      });
      bc.close();
    } catch {
      // ignore
    }
  };

  // Cross-tab real-time sync with BroadcastChannel (no re-subscribe on every message)
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('visioncore_live_chats');
      bc.onmessage = (event) => {
        if (!event.data) return;
        if (event.data.type === 'NEW_MESSAGE') {
          const msg = event.data.message as ChatMessage;
          if (!chatsRef.current.some((c) => c.id === msg.id)) {
            onSendMessageRef.current(msg);
          }
        } else if (event.data.type === 'PRESENCE') {
          const { chatKey, userId, userName, status } = event.data;
          const activeKey =
            selectedChatIdRef.current === 'general'
              ? 'general'
              : getCanonicalDmChatId(currentUser.id, selectedChatIdRef.current);
          if (userId !== currentUser.id && chatKey === activeKey) {
            setActiveTypers((prev) => {
              const filtered = prev.filter((t) => t.userId !== userId);
              if (status === 'idle') return filtered;
              return [...filtered, { userId, userName, status }];
            });
          }
        }
      };
    } catch {
      // fallback
    }
    return () => {
      bc?.close();
    };
  }, [currentUser.id]);

  // Fast server polling for real-time messages & typing/recording status
  useEffect(() => {
    let cancelled = false;

    const pollServer = async () => {
      if (!getToken() || cancelled) return;
      try {
        const data = await api<ChatMessage[]>('/api/chats');
        if (!cancelled && Array.isArray(data)) {
          const knownIds = new Set(chatsRef.current.map((c) => c.id));
          data.forEach((serverMsg) => {
            if (!knownIds.has(serverMsg.id)) {
              onSendMessageRef.current(serverMsg);
            }
          });
        }
      } catch {
        // silent fallback
      }

      try {
        const activeKey =
          selectedChatIdRef.current === 'general'
            ? 'general'
            : getCanonicalDmChatId(currentUser.id, selectedChatIdRef.current);
        const res = await api<{ active: TypingUser[] }>(
          `/api/chats/presence?chatId=${encodeURIComponent(activeKey)}`
        );
        if (!cancelled && res && Array.isArray(res.active)) {
          setActiveTypers(res.active);
        }
      } catch {
        // ignore
      }
    };

    void pollServer();
    const interval = setInterval(() => {
      void pollServer();
    }, 1500);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [currentUser.id]);

  // Refresh typing presence immediately when switching active chat
  useEffect(() => {
    setActiveTypers([]);
    if (!getToken()) return;
    void api<{ active: TypingUser[] }>(
      `/api/chats/presence?chatId=${encodeURIComponent(currentChatKey)}`
    )
      .then((res) => {
        if (res && Array.isArray(res.active)) setActiveTypers(res.active);
      })
      .catch(() => {});
  }, [currentChatKey]);

  // Maintain recording heartbeat while mic is active
  useEffect(() => {
    if (!isRecording) return;
    sendPresenceSignal('recording');
    const beat = setInterval(() => {
      sendPresenceSignal('recording');
    }, 2000);
    return () => {
      clearInterval(beat);
    };
  }, [isRecording, currentChatKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats.length, selectedChatId, mobileView]);

  // Build list of all DM peer IDs (from persisted chat history + explicitly opened DMs in session)
  const dmPeerIds = useMemo(() => {
    const ids = new Set<string>(openedDmIds);
    chats.forEach((c) => {
      const participants = extractDmParticipants(c.chatId || '');
      if (!participants) return;
      const [p1, p2] = participants;
      if (p1 === currentUser.id && p2 !== currentUser.id) ids.add(p2);
      else if (p2 === currentUser.id && p1 !== currentUser.id) ids.add(p1);
    });
    if (selectedChatId !== 'general' && selectedChatId !== currentUser.id) {
      ids.add(selectedChatId);
    }
    return Array.from(ids);
  }, [chats, openedDmIds, selectedChatId, currentUser.id]);

  // Build peer user objects safely even if a brand-new sender hasn't finished syncing into allUsers yet
  const activeChatUsers: User[] = useMemo(() => {
    return dmPeerIds.map((peerId) => {
      const existing = allUsers.find((u) => u.id === peerId);
      if (existing) return existing;
      const peerMsg = chats.find((m) => m.senderId === peerId);
      return {
        id: peerId,
        username: peerMsg?.senderName || peerId,
        firstName: peerMsg?.senderName || 'Foydalanuvchi',
        lastName: '',
        phone: '',
        email: '',
        role: (peerMsg?.senderRole as User['role']) || 'user',
        avatar:
          peerMsg?.senderAvatar ||
          `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(peerId)}`,
        registeredAt: new Date().toISOString(),
      };
    });
  }, [dmPeerIds, allUsers, chats]);

  // Filter & strictly sort messages chronologically so sent messages NEVER swap positions
  const filteredMessages = useMemo(() => {
    const list = chats.filter((c) => {
      if (selectedChatId === 'general') {
        return !c.chatId || c.chatId === 'general';
      }
      const participants = extractDmParticipants(c.chatId || '');
      if (!participants) return false;
      const [p1, p2] = participants;
      return (
        (p1 === currentUser.id && p2 === selectedChatId) ||
        (p1 === selectedChatId && p2 === currentUser.id)
      );
    });

    return [...list].sort((a, b) => {
      const tsA = getMessageOrderTs(a);
      const tsB = getMessageOrderTs(b);
      if (tsA !== tsB) return tsA - tsB;
      return a.id.localeCompare(b.id);
    });
  }, [chats, selectedChatId, currentUser.id]);

  const selectedUser =
    activeChatUsers.find((u) => u.id === selectedChatId) ||
    allUsers.find((u) => u.id === selectedChatId);

  const broadcastMessage = (msg: ChatMessage) => {
    onSendMessage(msg);
    sendPresenceSignal('idle', msg.chatId);

    if (getToken()) {
      void apiPost('/api/chats', msg).catch(() => {});
    }

    try {
      const bc = new BroadcastChannel('visioncore_live_chats');
      bc.postMessage({ type: 'NEW_MESSAGE', message: msg });
      bc.close();
    } catch {
      // ignore
    }
  };

  const handleInputChange = (val: string) => {
    setInputText(val);
    const now = Date.now();
    if (val.trim()) {
      if (now - lastTypingPingRef.current > 1800) {
        lastTypingPingRef.current = now;
        sendPresenceSignal('typing');
      }
      if (typingIdleTimerRef.current) clearTimeout(typingIdleTimerRef.current);
      typingIdleTimerRef.current = setTimeout(() => {
        sendPresenceSignal('idle');
      }, 2600);
    } else {
      if (typingIdleTimerRef.current) clearTimeout(typingIdleTimerRef.current);
      sendPresenceSignal('idle');
    }
  };

  const handleSendText = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !attachmentUrl) return;

    if (typingIdleTimerRef.current) clearTimeout(typingIdleTimerRef.current);

    const nowIso = new Date().toISOString();
    const currentChatTarget =
      selectedChatId === 'general'
        ? 'general'
        : getCanonicalDmChatId(currentUser.id, selectedChatId);

    if (selectedChatId !== 'general') {
      setOpenedDmIds((prev) => (prev.includes(selectedChatId) ? prev : [selectedChatId, ...prev]));
    }

    const newMsg: ChatMessage = {
      id: `MSG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      senderId: currentUser.id,
      senderName: currentUserDisplayName,
      senderRole: currentUser.role,
      senderAvatar: currentUser.avatar,
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
      createdAt: nowIso,
      chatId: currentChatTarget,
      attachmentUrl: attachmentUrl || undefined,
    };

    broadcastMessage(newMsg);
    setInputText('');
    setAttachmentUrl('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachmentUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch {
      // mic permission denied
    }
  };

  const stopAndSendRecording = () => {
    if (!mediaRecorderRef.current || !isRecording) return;

    const targetChatIdSnapshot = selectedChatId;
    const durationSnapshot = recordingDuration || 1;

    mediaRecorderRef.current.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.onload = () => {
        const base64Audio = reader.result as string;
        const nowIso = new Date().toISOString();
        const currentChatTarget =
          targetChatIdSnapshot === 'general'
            ? 'general'
            : getCanonicalDmChatId(currentUser.id, targetChatIdSnapshot);

        if (targetChatIdSnapshot !== 'general') {
          setOpenedDmIds((prev) =>
            prev.includes(targetChatIdSnapshot) ? prev : [targetChatIdSnapshot, ...prev]
          );
        }

        const newMsg: ChatMessage = {
          id: `MSG-VOICE-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          senderId: currentUser.id,
          senderName: currentUserDisplayName,
          senderRole: currentUser.role,
          senderAvatar: currentUser.avatar,
          text: 'Ovozli xabar',
          timestamp: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
          createdAt: nowIso,
          chatId: currentChatTarget,
          audioUrl: base64Audio,
          audioDuration: durationSnapshot,
        };

        broadcastMessage(newMsg);
      };
      reader.readAsDataURL(audioBlob);

      mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    };

    mediaRecorderRef.current.stop();
    setIsRecording(false);
    clearInterval(timerRef.current);
    sendPresenceSignal('idle');
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
    setIsRecording(false);
    clearInterval(timerRef.current);
    audioChunksRef.current = [];
    sendPresenceSignal('idle');
  };

  const handlePlayVoice = (msgId: string, audioUrl: string) => {
    if (playingAudioId === msgId) {
      audioPlayerRef.current?.pause();
      setPlayingAudioId(null);
      return;
    }

    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }

    const audio = new Audio(audioUrl);
    audioPlayerRef.current = audio;
    setPlayingAudioId(msgId);

    audio.onended = () => {
      setPlayingAudioId(null);
    };

    audio.play().catch(() => {
      setPlayingAudioId(null);
    });
  };

  const handleSelectChat = (chatId: string) => {
    if (chatId !== 'general' && chatId !== currentUser.id) {
      setOpenedDmIds((prev) => (prev.includes(chatId) ? prev : [chatId, ...prev]));
    }
    setSelectedChatId(chatId);
    setMobileView('chat');
    setShowSearchModal(false);
  };

  const handleOpenDirectChatWithUser = (userId: string) => {
    if (!userId || userId === currentUser.id) return;
    handleSelectChat(userId);
  };

  const searchResults = searchQuery.trim()
    ? allUsers.filter((u) => {
        if (u.id === currentUser.id) return false;
        const q = searchQuery.toLowerCase().trim();
        return (
          u.id.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q) ||
          (u.firstName && u.firstName.toLowerCase().includes(q)) ||
          (u.lastName && u.lastName.toLowerCase().includes(q))
        );
      })
    : [];

  // Dynamic live status next to "|" in chat header
  const recorder = activeTypers.find((t) => t.status === 'recording');
  const typer = activeTypers.find((t) => t.status === 'typing');
  const liveRightText = recorder
    ? selectedChatId === 'general'
      ? `${recorder.userName} ovozli xabar yubormoqda...`
      : 'ovozli xabar yubormoqda...'
    : typer
    ? selectedChatId === 'general'
      ? `${typer.userName} yozmoqda...`
      : 'yozmoqda...'
    : null;

  return (
    <div className="p-2 sm:p-6 h-full flex flex-col md:flex-row gap-4 sm:gap-6 max-w-7xl mx-auto min-h-0">
      {/* Search User Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md p-6 rounded-3xl liquid-glass text-slate-900 dark:text-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-300/60 dark:border-white/10 pb-3">
              <div className="flex items-center space-x-2">
                <Search className="w-5 h-5 text-blue-500" />
                <h3 className="text-sm font-bold">Foydalanuvchini Qidirish</h3>
              </div>
              <button
                onClick={() => setShowSearchModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                12 xonali ID yoki Foydalanuvchi nomi (username)
              </label>
              <input
                type="text"
                autoFocus
                placeholder="Masalan: vcg_78728082 yoki vcg-creator"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl liquid-glass-subtle text-xs sm:text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pt-1">
              {searchQuery.trim() && searchResults.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">
                  Bunday ID yoki nomli foydalanuvchi topilmadi
                </p>
              ) : (
                searchResults.map((foundUser) => (
                  <div
                    key={foundUser.id}
                    className="p-3 rounded-2xl liquid-glass-subtle flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={
                          foundUser.avatar ||
                          `https://api.dicebear.com/7.x/identicon/svg?seed=${foundUser.username}`
                        }
                        alt={foundUser.username}
                        className="w-9 h-9 rounded-xl object-cover border border-slate-300 dark:border-white/15"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          {foundUser.firstName || foundUser.username} {foundUser.lastName || ''}
                        </h4>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-mono font-bold text-blue-500">
                            {foundUser.id}
                          </span>
                          <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400">
                            {foundUser.role}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenDirectChatWithUser(foundUser.id)}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center space-x-1 cursor-pointer shadow-sm"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Xabar yozish</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* LEFT/CENTER: Active Chat Conversation Box (Full-screen on mobile when mobileView === 'chat') */}
      <div
        className={`flex-1 rounded-3xl liquid-glass flex-col overflow-hidden min-h-0 ${
          mobileView === 'chat' ? 'flex' : 'hidden md:flex'
        }`}
      >
        {/* Chat Header */}
        <div className="p-3 sm:p-4 border-b border-slate-200/60 dark:border-white/10 flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
            {/* Mobile back button to Chat List */}
            <button
              type="button"
              onClick={() => setMobileView('list')}
              className="md:hidden p-2 rounded-xl liquid-glass-subtle text-slate-700 dark:text-slate-200 hover:text-blue-500 flex items-center space-x-1 cursor-pointer flex-shrink-0"
              title="Chatlar ro'yxati"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-[11px] font-bold">Chatlar</span>
            </button>

            <div
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center font-bold text-white shadow-md flex-shrink-0 ${
                selectedChatId === 'general' ? 'bg-blue-600' : 'bg-purple-600'
              }`}
            >
              {selectedChatId === 'general' ? (
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </div>

            <div className="min-w-0">
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                {selectedChatId === 'general'
                  ? 'Umumiy guruh chati'
                  : `${selectedUser?.firstName || selectedUser?.username || 'Foydalanuvchi'} (Shaxsiy Chat)`}
              </h2>
              <div className="flex items-center space-x-1.5 truncate">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {selectedChatId === 'general'
                    ? `${allUsers.length} ta a'zo faol`
                    : `ID: ${selectedUser?.id || selectedChatId}`}
                </span>
                {liveRightText ? (
                  <span className="text-[11px] font-semibold text-blue-500 dark:text-blue-400 animate-pulse truncate">
                    | {liveRightText}
                  </span>
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            <button
              onClick={() => setShowSearchModal(true)}
              className="px-3 py-1.5 rounded-xl border border-blue-500/30 bg-blue-500/15 hover:bg-blue-500/25 text-blue-600 dark:text-blue-400 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ID orqali qidirish</span>
            </button>
            <div className="hidden sm:inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Real-time Faol</span>
            </div>
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 p-3.5 sm:p-6 overflow-y-auto space-y-4 min-h-0">
          {filteredMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 dark:text-slate-400 space-y-2">
              <div className="w-12 h-12 rounded-2xl liquid-glass-subtle flex items-center justify-center text-slate-500 dark:text-slate-400">
                <MessageCircle className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold">Bu yerda xabarlar yo'q</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {selectedChatId === 'general'
                  ? "Birinchi bo'lib xabar yoki ovozli xabar yuboring!"
                  : 'Ushbu foydalanuvchiga birinchi shaxsiy xabaringizni yuboring!'}
              </p>
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const isMine = msg.senderId === currentUser.id;
              const isVoice = Boolean(msg.audioUrl);
              const sender = allUsers.find((u) => u.id === msg.senderId);
              const senderAvatar =
                msg.senderAvatar ||
                sender?.avatar ||
                `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(msg.senderName)}`;

              return (
                <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`flex items-center space-x-2 mb-1 px-1 text-[11px] text-slate-500 dark:text-slate-400 ${
                      isMine ? 'flex-row-reverse space-x-reverse' : ''
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => !isMine && handleOpenDirectChatWithUser(msg.senderId)}
                      title={!isMine ? `${msg.senderName} bilan shaxsiy chat ochish` : undefined}
                      className={`relative group rounded-full overflow-hidden flex-shrink-0 transition ${
                        !isMine ? 'cursor-pointer hover:ring-2 hover:ring-blue-500' : 'cursor-default'
                      }`}
                    >
                      <img
                        src={senderAvatar}
                        alt={msg.senderName}
                        className="w-5 h-5 rounded-full object-cover border border-slate-300 dark:border-white/20"
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() => !isMine && handleOpenDirectChatWithUser(msg.senderId)}
                      className={`font-semibold hover:underline ${
                        isMine ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200 cursor-pointer'
                      }`}
                      title={!isMine ? 'Shaxsiy xabar yozish' : undefined}
                    >
                      {msg.senderName}
                    </button>

                    <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded liquid-glass-subtle text-slate-600 dark:text-slate-300">
                      {msg.senderRole}
                    </span>

                    <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400">
                      ({sender?.id || msg.senderId})
                    </span>

                    <span className="text-[10px] text-slate-500 dark:text-slate-400">{msg.timestamp}</span>
                  </div>

                  <div
                    className={`max-w-[85%] sm:max-w-md p-3.5 rounded-2xl text-xs sm:text-sm font-medium shadow-sm transition ${
                      isMine
                        ? 'bg-blue-600/95 text-white rounded-tr-xs'
                        : 'liquid-glass-subtle text-slate-900 dark:text-slate-100 rounded-tl-xs'
                    }`}
                  >
                    {msg.attachmentUrl && (
                      <div className="mb-2 rounded-xl overflow-hidden max-h-48 border border-white/20">
                        <img src={msg.attachmentUrl} alt="Fayl" className="w-full object-cover" />
                      </div>
                    )}

                    {isVoice ? (
                      <div className="flex items-center space-x-3 py-1 min-w-[200px]">
                        <button
                          type="button"
                          onClick={() => handlePlayVoice(msg.id, msg.audioUrl!)}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 cursor-pointer shadow-md transition active:scale-95 ${
                            isMine
                              ? 'bg-white text-blue-600 hover:bg-blue-50'
                              : 'bg-blue-600 text-white hover:bg-blue-500'
                          }`}
                        >
                          {playingAudioId === msg.id ? (
                            <Pause className="w-4 h-4 fill-current" />
                          ) : (
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          )}
                        </button>

                        <div className="flex-1 space-y-1">
                          <div className="flex items-center space-x-1 h-4">
                            {[40, 70, 30, 90, 60, 45, 80, 50, 65, 35, 75, 45, 85].map((h, idx) => (
                              <span
                                key={idx}
                                className={`w-1 rounded-full transition-all ${
                                  playingAudioId === msg.id ? 'animate-pulse' : ''
                                } ${isMine ? 'bg-white/80' : 'bg-blue-500'}`}
                                style={{ height: `${h}%` }}
                              />
                            ))}
                          </div>
                          <div className={`text-[10px] font-mono ${isMine ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>
                            {msg.audioDuration
                              ? `${Math.floor(msg.audioDuration / 60)}:${(msg.audioDuration % 60)
                                  .toString()
                                  .padStart(2, '0')}`
                              : '0:05'}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Attachment preview above input */}
        {attachmentUrl && (
          <div className="px-4 py-2 liquid-glass-subtle border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-xs">
            <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center space-x-1">
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Rasm biriktirildi</span>
            </span>
            <button
              onClick={() => setAttachmentUrl('')}
              className="text-slate-400 hover:text-rose-500 font-bold cursor-pointer"
            >
              ×
            </button>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-slate-200/60 dark:border-white/10">
          {isRecording ? (
            <div className="flex items-center justify-between p-2 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 animate-in fade-in">
              <div className="flex items-center space-x-2 pl-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping"></span>
                <span className="font-bold text-xs">Ovoz yozilmoqda...</span>
                <span className="font-mono text-xs font-black">
                  {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={cancelRecording}
                  className="px-3 py-1.5 rounded-xl liquid-glass-subtle text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="button"
                  onClick={stopAndSendRecording}
                  className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center space-x-1 shadow-md cursor-pointer"
                >
                  <Square className="w-3 h-3 fill-current" />
                  <span>Yuborish</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSendText} className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-xl liquid-glass-subtle text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                title="Rasm yoki fayl biriktirish"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              <input
                type="text"
                placeholder="Xabar yozing..."
                value={inputText}
                onChange={(e) => handleInputChange(e.target.value)}
                className="flex-grow px-4 py-2.5 rounded-xl liquid-glass-subtle text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition"
              />

              <button
                type="button"
                onClick={startRecording}
                className="p-2.5 rounded-xl liquid-glass-subtle text-slate-600 dark:text-slate-300 hover:text-rose-500 transition cursor-pointer"
                title="Ovozli xabar yuborish"
              >
                <Mic className="w-4 h-4" />
              </button>

              <button
                type="submit"
                disabled={!inputText.trim() && !attachmentUrl}
                className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white transition shadow-md active:scale-95 cursor-pointer flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* RIGHT SIDEBAR / MOBILE FULL-SCREEN LIST VIEW */}
      <div
        className={`w-full md:w-72 rounded-3xl liquid-glass p-4 flex-col space-y-4 overflow-y-auto min-h-0 flex-1 md:flex-initial ${
          mobileView === 'list' ? 'flex' : 'hidden md:flex'
        }`}
      >
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              CHATINGIZ RO'YXATI
            </span>
            <button
              onClick={() => setShowSearchModal(true)}
              className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1 cursor-pointer"
              title="Foydalanuvchi qidirish"
            >
              <Search className="w-3 h-3" />
              <span>Qidiruv</span>
            </button>
          </div>

          <button
            onClick={() => handleSelectChat('general')}
            className={`w-full p-3 rounded-2xl flex items-center space-x-3 transition cursor-pointer text-left ${
              selectedChatId === 'general'
                ? 'bg-blue-600 text-white shadow-md'
                : 'liquid-glass-subtle text-slate-800 dark:text-slate-200 hover:border-blue-500/40'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                selectedChatId === 'general'
                  ? 'bg-white/20 text-white'
                  : 'bg-blue-600/15 text-blue-600 dark:text-blue-400'
              }`}
            >
              <Users className="w-4 h-4" />
            </div>
            <div className="flex-grow truncate">
              <h4 className="text-xs font-bold truncate">Umumiy guruh chati</h4>
              <p
                className={`text-[10px] truncate ${
                  selectedChatId === 'general' ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Barcha a'zolar bilan suhbat
              </p>
            </div>
          </button>
        </div>

        <div className="space-y-1.5 flex-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-2 block">
            SHAXSIY CHATLAR ({activeChatUsers.length})
          </span>

          {activeChatUsers.length === 0 ? (
            <div className="p-4 rounded-2xl liquid-glass-subtle text-center space-y-2">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Hozircha shaxsiy chatlar yo'q.
              </p>
              <button
                type="button"
                onClick={() => setShowSearchModal(true)}
                className="w-full py-2 rounded-xl bg-blue-600/15 hover:bg-blue-600 text-blue-600 dark:text-blue-400 hover:text-white text-xs font-bold transition flex items-center justify-center space-x-1 cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Foydalanuvchi qidirish</span>
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {activeChatUsers.map((member) => {
                const isSelected = selectedChatId === member.id;
                return (
                  <button
                    key={member.id}
                    onClick={() => handleSelectChat(member.id)}
                    className={`w-full p-2.5 rounded-2xl flex items-center space-x-3 transition cursor-pointer text-left ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'liquid-glass-subtle text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <img
                      src={
                        member.avatar ||
                        `https://api.dicebear.com/7.x/identicon/svg?seed=${member.username}`
                      }
                      alt={member.firstName}
                      className="w-8 h-8 rounded-xl object-cover border border-slate-300 dark:border-white/20"
                    />
                    <div className="flex-grow truncate">
                      <h4 className="text-xs font-bold truncate">
                        {member.firstName || member.username} {member.lastName || ''}
                      </h4>
                      <div className="flex items-center space-x-1.5">
                        <span
                          className={`text-[9px] font-mono ${
                            isSelected ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {member.id}
                        </span>
                        <span
                          className={`text-[9px] uppercase font-bold tracking-wider ${
                            isSelected ? 'text-blue-100' : 'text-blue-600 dark:text-blue-400'
                          }`}
                        >
                          • {member.role}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
