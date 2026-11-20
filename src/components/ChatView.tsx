import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  MoreVertical,
  Trash2,
  ArrowDown,
  Bell,
  BellOff,
  Reply,
  Pencil,
  Check,
  AlertCircle,
} from 'lucide-react';
import { User, ChatMessage, OnlineUserInfo } from '../types';
import { api, apiPost, getToken } from '../lib/api';
import {
  getCanonicalDmChatId,
  extractDmParticipants,
  getChatMessageTimestampMs,
  sortChatMessages,
  formatChatDayLabel,
  getChatDayKey,
  encodeReplyText,
  parseReplyText,
} from '../lib/chatUtils';

interface ChatViewProps {
  currentUser: User;
  allUsers: User[];
  chats: ChatMessage[];
  onlineUsers?: OnlineUserInfo[];
  groupChatNotifications?: boolean;
  onToggleGroupChatNotifications?: () => void;
  onSyncServerChats?: (serverChats: ChatMessage[]) => void;
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

const WAVE_BARS = [38, 68, 42, 90, 56, 75, 48, 86, 62, 40, 78, 52, 92, 60, 44, 80, 55, 70];

function formatDuration(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export const ChatView: React.FC<ChatViewProps> = ({
  currentUser,
  allUsers,
  chats,
  onlineUsers = [],
  groupChatNotifications = true,
  onToggleGroupChatNotifications,
  onSyncServerChats,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
}) => {
  const [selectedChatId, setSelectedChatId] = useState<string>('general');
  const [mobileView, setMobileView] = useState<'chat' | 'list'>('chat');
  const [openedDmIds, setOpenedDmIds] = useState<string[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [attachmentUrl, setAttachmentUrl] = useState<string>('');
  const [replyTarget, setReplyTarget] = useState<ChatMessage | null>(null);

  // Inline Edit & Delete states
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  const [confirmDeleteMsgId, setConfirmDeleteMsgId] = useState<string | null>(null);

  // Per-user cleared chat history cutoff timestamps
  const [clearedAtMap, setClearedAtMap] = useState<Record<string, string>>(() => {
    try {
      const raw = localStorage.getItem(`visioncore_chat_cleared_${currentUser.id}`);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  // Chat management menu (3-dots) & search & modals
  const [showManageMenu, setShowManageMenu] = useState<boolean>(false);
  const [confirmClearChat, setConfirmClearChat] = useState<boolean>(false);
  const [isClearingChat, setIsClearingChat] = useState<boolean>(false);
  const [showInChatSearch, setShowInChatSearch] = useState<boolean>(false);
  const [inChatSearchQuery, setInChatSearchQuery] = useState<string>('');
  const [showOnlineModal, setShowOnlineModal] = useState<boolean>(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Voice recording & playback state
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [micError, setMicError] = useState<string>('');
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState<{ current: number; duration: number }>({
    current: 0,
    duration: 0,
  });
  const [playbackRate, setPlaybackRate] = useState<1 | 1.5 | 2>(1);

  // Live typing / recording presence from other users
  const [activeTypers, setActiveTypers] = useState<TypingUser[]>([]);

  // Search User modal state
  const [showSearchModal, setShowSearchModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Smart scroll tracking
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState<boolean>(false);
  const [unseenCount, setUnseenCount] = useState<number>(0);
  const isNearBottomRef = useRef<boolean>(true);
  const prevVisibleCountRef = useRef<number>(0);
  const feedContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const manageMenuRef = useRef<HTMLDivElement | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartedAtRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const chatsRef = useRef<ChatMessage[]>(chats);
  chatsRef.current = chats;
  const onSendMessageRef = useRef(onSendMessage);
  onSendMessageRef.current = onSendMessage;
  const onSyncServerChatsRef = useRef(onSyncServerChats);
  onSyncServerChatsRef.current = onSyncServerChats;
  const selectedChatIdRef = useRef(selectedChatId);
  selectedChatIdRef.current = selectedChatId;

  const typingIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingPingRef = useRef<number>(0);

  const currentChatKey =
    selectedChatId === 'general'
      ? 'general'
      : getCanonicalDmChatId(currentUser.id, selectedChatId);

  const currentUserDisplayName =
    `${currentUser.firstName || currentUser.username} ${currentUser.lastName || ''}`.trim();

  const onlineUserIds = useMemo(
    () => new Set<string>([currentUser.id, ...onlineUsers.map((o) => o.userId)]),
    [onlineUsers, currentUser.id]
  );

  // Close 3-dots menu when clicking outside
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (manageMenuRef.current && !manageMenuRef.current.contains(e.target as Node)) {
        setShowManageMenu(false);
        setConfirmClearChat(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Load persisted per-user cleared chat cutoffs on mount / user switch
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`visioncore_chat_cleared_${currentUser.id}`);
      setClearedAtMap(raw ? JSON.parse(raw) : {});
    } catch {
      setClearedAtMap({});
    }
    if (!getToken()) return;
    void api<{ cleared: Record<string, string> }>('/api/chats/clear-history')
      .then((res) => {
        if (res?.cleared && typeof res.cleared === 'object') {
          setClearedAtMap((prev) => {
            const merged: Record<string, string> = { ...prev };
            for (const [k, v] of Object.entries(res.cleared)) {
              if (!merged[k] || Date.parse(v) > Date.parse(merged[k])) {
                merged[k] = v;
              }
            }
            localStorage.setItem(`visioncore_chat_cleared_${currentUser.id}`, JSON.stringify(merged));
            return merged;
          });
        }
      })
      .catch(() => {});
  }, [currentUser.id]);

  // Cleanup audio & timers on unmount
  useEffect(() => {
    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
      if (timerRef.current) clearInterval(timerRef.current);
      if (typingIdleTimerRef.current) clearTimeout(typingIdleTimerRef.current);
    };
  }, []);

  // Broadcast typing / recording state helper
  const sendPresenceSignal = useCallback(
    (status: 'typing' | 'recording' | 'idle', targetChatKey = currentChatKey) => {
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
    },
    [currentChatKey, currentUser.id, currentUserDisplayName]
  );

  // Cross-tab real-time sync with BroadcastChannel
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

  // Smooth server polling for real-time messages & typing/recording status
  useEffect(() => {
    let cancelled = false;

    const pollServer = async () => {
      if (!getToken() || cancelled) return;
      try {
        const data = await api<ChatMessage[]>('/api/chats');
        if (!cancelled && Array.isArray(data)) {
          if (onSyncServerChatsRef.current) {
            onSyncServerChatsRef.current(data);
          } else {
            const knownIds = new Set(chatsRef.current.map((c) => c.id));
            data.forEach((serverMsg) => {
              if (!knownIds.has(serverMsg.id)) {
                onSendMessageRef.current(serverMsg);
              }
            });
          }
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
    }, 1800);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [currentUser.id]);

  // Refresh typing presence immediately when switching active chat
  useEffect(() => {
    setActiveTypers([]);
    setShowManageMenu(false);
    setConfirmClearChat(false);
    setShowInChatSearch(false);
    setInChatSearchQuery('');
    setReplyTarget(null);
    setEditingMsgId(null);
    setConfirmDeleteMsgId(null);

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
  }, [isRecording, currentChatKey, sendPresenceSignal]);

  // Filter & strictly sort messages chronologically, applying per-user clear cutoff & in-chat search
  const currentClearedCutoffMs = useMemo(() => {
    const iso = clearedAtMap[currentChatKey];
    if (!iso) return 0;
    const ms = Date.parse(iso);
    return Number.isNaN(ms) ? 0 : ms;
  }, [clearedAtMap, currentChatKey]);

  const filteredMessages = useMemo(() => {
    const query = inChatSearchQuery.trim().toLowerCase();

    const list = chats.filter((c) => {
      if (selectedChatId === 'general') {
        if (c.chatId && c.chatId !== 'general') return false;
      } else {
        const participants = extractDmParticipants(c.chatId || '');
        if (!participants) return false;
        const [p1, p2] = participants;
        const matchesPair =
          (p1 === currentUser.id && p2 === selectedChatId) ||
          (p1 === selectedChatId && p2 === currentUser.id);
        if (!matchesPair) return false;
      }

      // Per-user history clear filter (only affects THIS user!)
      if (currentClearedCutoffMs > 0) {
        const msgMs = getChatMessageTimestampMs(c);
        if (msgMs > 0 && msgMs <= currentClearedCutoffMs) {
          return false;
        }
      }

      if (query) {
        const hay = `${c.text || ''} ${c.senderName || ''}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }

      return true;
    });

    return sortChatMessages(list);
  }, [chats, selectedChatId, currentUser.id, currentClearedCutoffMs, inChatSearchQuery]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior });
      setShowScrollBottomBtn(false);
      setUnseenCount(0);
    });
  }, []);

  // Scroll to bottom when switching chat or opening chat view on mobile
  useEffect(() => {
    prevVisibleCountRef.current = filteredMessages.length;
    isNearBottomRef.current = true;
    scrollToBottom('auto');
  }, [selectedChatId, mobileView]);

  // Smart auto-scroll when new messages arrive
  useEffect(() => {
    const prevCount = prevVisibleCountRef.current;
    const nextCount = filteredMessages.length;
    prevVisibleCountRef.current = nextCount;

    if (nextCount <= prevCount) return;

    const latestMsg = filteredMessages[nextCount - 1];
    const sentByMe = latestMsg?.senderId === currentUser.id;

    if (sentByMe || isNearBottomRef.current) {
      scrollToBottom('smooth');
    } else {
      setShowScrollBottomBtn(true);
      setUnseenCount((n) => n + (nextCount - prevCount));
    }
  }, [filteredMessages, currentUser.id, scrollToBottom]);

  const handleFeedScroll = () => {
    const el = feedContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const nearBottom = distanceFromBottom < 120;
    isNearBottomRef.current = nearBottom;
    if (nearBottom) {
      setShowScrollBottomBtn(false);
      setUnseenCount(0);
    } else {
      setShowScrollBottomBtn(true);
    }
  };

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

  const selectedUser =
    activeChatUsers.find((u) => u.id === selectedChatId) ||
    allUsers.find((u) => u.id === selectedChatId);

  const selectedUserIsOnline =
    selectedChatId !== 'general' && onlineUserIds.has(selectedChatId);

  const dispatchMessage = (msg: ChatMessage) => {
    onSendMessage(msg);
    sendPresenceSignal('idle', msg.chatId);
    isNearBottomRef.current = true;
    scrollToBottom('smooth');
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

  const getNextClientSafeIso = () => {
    const latestExisting = chatsRef.current.reduce(
      (max, m) => Math.max(max, getChatMessageTimestampMs(m)),
      0
    );
    const safeMs = Math.max(Date.now(), latestExisting + 1);
    return {
      iso: new Date(safeMs).toISOString(),
      epoch: safeMs,
    };
  };

  const handleSendText = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !attachmentUrl) return;

    if (typingIdleTimerRef.current) clearTimeout(typingIdleTimerRef.current);

    const { iso, epoch } = getNextClientSafeIso();
    const currentChatTarget =
      selectedChatId === 'general'
        ? 'general'
        : getCanonicalDmChatId(currentUser.id, selectedChatId);

    if (selectedChatId !== 'general') {
      setOpenedDmIds((prev) => (prev.includes(selectedChatId) ? prev : [selectedChatId, ...prev]));
    }

    let finalText = inputText.trim();
    if (replyTarget) {
      const parsedReply = parseReplyText(replyTarget.text || '');
      const snippet = replyTarget.audioUrl
        ? 'Ovozli xabar'
        : parsedReply.body || (replyTarget.attachmentUrl ? 'Rasm' : '');
      finalText = encodeReplyText(replyTarget.senderName, snippet, finalText);
    }

    const newMsg: ChatMessage = {
      id: `MSG-${epoch}-${Math.floor(Math.random() * 1000)}`,
      senderId: currentUser.id,
      senderName: currentUserDisplayName,
      senderRole: currentUser.role,
      senderAvatar: currentUser.avatar,
      text: finalText,
      timestamp: new Date(epoch).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
      createdAt: iso,
      chatId: currentChatTarget,
      attachmentUrl: attachmentUrl || undefined,
    };

    dispatchMessage(newMsg);
    setInputText('');
    setAttachmentUrl('');
    setReplyTarget(null);
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
    e.target.value = '';
  };

  const startRecording = async () => {
    setMicError('');
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
        setMicError("Brauzeringiz ovoz yozishni qo'llab-quvvatlamaydi.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const preferredTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
      ];
      const supportedMime = preferredTypes.find((t) => MediaRecorder.isTypeSupported(t)) || '';
      const recorderOptions: MediaRecorderOptions = {
        ...(supportedMime ? { mimeType: supportedMime } : {}),
        audioBitsPerSecond: 32000,
      };

      const mediaRecorder = new MediaRecorder(stream, recorderOptions);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      recordingStartedAtRef.current = Date.now();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingDuration(0);

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        const secs = Math.floor((Date.now() - recordingStartedAtRef.current) / 1000);
        setRecordingDuration(secs);
      }, 250);
    } catch {
      setMicError('Mikrofonga ruxsat berilmadi.');
    }
  };

  const stopAndSendRecording = () => {
    if (!mediaRecorderRef.current || !isRecording) return;

    const recorder = mediaRecorderRef.current;
    const targetChatIdSnapshot = selectedChatId;
    const elapsedSeconds = Math.max(
      1,
      Math.round((Date.now() - recordingStartedAtRef.current) / 1000)
    );
    const detectedMime =
      recorder.mimeType || audioChunksRef.current[0]?.type || 'audio/webm';

    recorder.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: detectedMime });
      recorder.stream.getTracks().forEach((track) => track.stop());
      audioChunksRef.current = [];

      if (audioBlob.size < 400) {
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64Audio = reader.result as string;
        const { iso, epoch } = getNextClientSafeIso();
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
          id: `MSG-VOICE-${epoch}-${Math.floor(Math.random() * 1000)}`,
          senderId: currentUser.id,
          senderName: currentUserDisplayName,
          senderRole: currentUser.role,
          senderAvatar: currentUser.avatar,
          text: 'Ovozli xabar',
          timestamp: new Date(epoch).toLocaleTimeString('uz-UZ', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          createdAt: iso,
          chatId: currentChatTarget,
          audioUrl: base64Audio,
          audioDuration: elapsedSeconds,
        };

        dispatchMessage(newMsg);
      };
      reader.readAsDataURL(audioBlob);
    };

    try {
      recorder.stop();
    } catch {
      recorder.stream.getTracks().forEach((track) => track.stop());
    }
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    sendPresenceSignal('idle');
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.onstop = null;
      try {
        if (mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
      } catch {
        // ignore
      }
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
    setIsRecording(false);
    setRecordingDuration(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    audioChunksRef.current = [];
    sendPresenceSignal('idle');
  };

  const handlePlayVoice = (msg: ChatMessage) => {
    if (!msg.audioUrl) return;

    if (playingAudioId === msg.id && audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      setPlayingAudioId(null);
      return;
    }

    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }

    const audio = new Audio(msg.audioUrl);
    audio.playbackRate = playbackRate;
    audioPlayerRef.current = audio;
    setPlayingAudioId(msg.id);
    setAudioProgress({ current: 0, duration: msg.audioDuration || 0 });

    audio.onloadedmetadata = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setAudioProgress((prev) => ({ ...prev, duration: audio.duration }));
      }
    };

    audio.ontimeupdate = () => {
      setAudioProgress({
        current: audio.currentTime,
        duration:
          Number.isFinite(audio.duration) && audio.duration > 0
            ? audio.duration
            : msg.audioDuration || 0,
      });
    };

    audio.onended = () => {
      setPlayingAudioId(null);
      setAudioProgress({ current: 0, duration: 0 });
    };

    audio.onerror = () => {
      setPlayingAudioId(null);
      setAudioProgress({ current: 0, duration: 0 });
    };

    audio.play().catch(() => {
      setPlayingAudioId(null);
    });
  };

  const handleSeekVoice = (msg: ChatMessage, fraction: number) => {
    if (playingAudioId !== msg.id || !audioPlayerRef.current) {
      handlePlayVoice(msg);
      return;
    }
    const dur =
      Number.isFinite(audioPlayerRef.current.duration) && audioPlayerRef.current.duration > 0
        ? audioPlayerRef.current.duration
        : msg.audioDuration || 1;
    audioPlayerRef.current.currentTime = Math.max(0, Math.min(dur, dur * fraction));
  };

  const cyclePlaybackRate = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next: 1 | 1.5 | 2 = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    setPlaybackRate(next);
    if (audioPlayerRef.current) {
      audioPlayerRef.current.playbackRate = next;
    }
  };

  // Clear chat history ONLY for the current user
  const handleClearChatForMe = async () => {
    setIsClearingChat(true);
    const nowIso = new Date().toISOString();
    const updatedMap = { ...clearedAtMap, [currentChatKey]: nowIso };
    setClearedAtMap(updatedMap);
    localStorage.setItem(`visioncore_chat_cleared_${currentUser.id}`, JSON.stringify(updatedMap));

    if (getToken()) {
      try {
        await apiPost('/api/chats/clear-history', {
          chatId: currentChatKey,
          clearedAt: nowIso,
        });
      } catch {
        // local cutoff remains active
      }
    }

    setIsClearingChat(false);
    setConfirmClearChat(false);
    setShowManageMenu(false);
  };

  const handleSaveEditMessage = (msg: ChatMessage) => {
    const trimmed = editingText.trim();
    if (!trimmed) return;
    const parsed = parseReplyText(msg.text);
    const finalSavedText =
      parsed.replyAuthor && parsed.replySnippet !== undefined
        ? encodeReplyText(parsed.replyAuthor, parsed.replySnippet, trimmed)
        : trimmed;
    onEditMessage(msg.id, finalSavedText);
    setEditingMsgId(null);
    setEditingText('');
  };

  const handleSelectChat = (chatId: string) => {
    if (chatId !== 'general' && chatId !== currentUser.id) {
      setOpenedDmIds((prev) => (prev.includes(chatId) ? prev : [chatId, ...prev]));
    }
    setSelectedChatId(chatId);
    setMobileView('chat');
    setShowSearchModal(false);
    setShowOnlineModal(false);
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

  const onlineListDisplay: OnlineUserInfo[] =
    onlineUsers.length > 0
      ? onlineUsers
      : [
          {
            userId: currentUser.id,
            username: currentUser.username,
            displayName: currentUserDisplayName,
            role: currentUser.role,
            avatar: currentUser.avatar,
            lastSeenAt: Date.now(),
            currentMenu: 'Chat',
          },
        ];

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
                searchResults.map((foundUser) => {
                  const isOnline = onlineUserIds.has(foundUser.id);
                  return (
                    <div
                      key={foundUser.id}
                      className="p-3 rounded-2xl liquid-glass-subtle flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative flex-shrink-0">
                          <img
                            src={
                              foundUser.avatar ||
                              `https://api.dicebear.com/7.x/identicon/svg?seed=${foundUser.username}`
                            }
                            alt={foundUser.username}
                            className="w-9 h-9 rounded-xl object-cover border border-slate-300 dark:border-white/15"
                          />
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-900 ${
                              isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                        </div>
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
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Online Users Modal */}
      {showOnlineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md p-6 rounded-3xl liquid-glass text-slate-900 dark:text-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-300/60 dark:border-white/10 pb-3">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-sm font-bold">
                  Hozir Saytda Online ({onlineListDisplay.length})
                </h3>
              </div>
              <button
                onClick={() => setShowOnlineModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {onlineListDisplay.map((ou) => {
                const isSelf = ou.userId === currentUser.id;
                return (
                  <div
                    key={ou.userId}
                    className="p-3 rounded-2xl liquid-glass-subtle flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="relative flex-shrink-0">
                        <img
                          src={
                            ou.avatar ||
                            `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(ou.username)}`
                          }
                          alt={ou.username}
                          className="w-9 h-9 rounded-xl object-cover border border-slate-300 dark:border-white/20"
                        />
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">
                          {ou.displayName || ou.username} {isSelf ? '(Siz)' : ''}
                        </div>
                        <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                          <span className="uppercase font-extrabold text-blue-600 dark:text-blue-400">
                            {ou.role}
                          </span>
                          {ou.currentMenu && (
                            <>
                              <span>•</span>
                              <span className="truncate">{ou.currentMenu}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {!isSelf && (
                      <button
                        type="button"
                        onClick={() => handleOpenDirectChatWithUser(ou.userId)}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center space-x-1 cursor-pointer flex-shrink-0"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Yozish</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Image Preview Modal */}
      {previewImageUrl && (
        <div
          onClick={() => setPreviewImageUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in cursor-zoom-out"
        >
          <button
            type="button"
            onClick={() => setPreviewImageUrl(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/15 text-white hover:bg-white/25 cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={previewImageUrl}
            alt="Rasm"
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl cursor-default"
          />
        </div>
      )}

      {/* LEFT/CENTER: Active Chat Conversation Box */}
      <div
        className={`flex-1 rounded-3xl liquid-glass flex-col overflow-hidden min-h-0 relative ${
          mobileView === 'chat' ? 'flex' : 'hidden md:flex'
        }`}
      >
        {/* Chat Header */}
        <div className="p-3 sm:p-4 border-b border-slate-200/60 dark:border-white/10 flex items-center justify-between gap-2 relative z-20">
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
                {selectedChatId === 'general' ? (
                  <button
                    type="button"
                    onClick={() => setShowOnlineModal(true)}
                    className="flex items-center space-x-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline cursor-pointer"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                    <span>{onlineListDisplay.length} ta online</span>
                    <span className="text-slate-400 dark:text-slate-500">
                      • {allUsers.length} a'zo
                    </span>
                  </button>
                ) : (
                  <span className="flex items-center space-x-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <span
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        selectedUserIsOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                      }`}
                    />
                    <span className={selectedUserIsOnline ? 'text-emerald-500 font-semibold' : ''}>
                      {selectedUserIsOnline ? 'Online' : 'Offline'}
                    </span>
                    <span className="hidden sm:inline font-mono">
                      • {selectedUser?.id || selectedChatId}
                    </span>
                  </span>
                )}

                {liveRightText && (
                  <span className="text-[11px] font-semibold text-blue-500 dark:text-blue-400 animate-pulse truncate">
                    | {liveRightText}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0">
            <button
              onClick={() => setShowSearchModal(true)}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl border border-blue-500/30 bg-blue-500/15 hover:bg-blue-500/25 text-blue-600 dark:text-blue-400 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
              title="Foydalanuvchini ID orqali qidirish"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ID orqali qidirish</span>
            </button>

            {/* Three-Dots Chat Management Dropdown (Replaces static Real-time Faol badge) */}
            <div className="relative" ref={manageMenuRef}>
              <button
                type="button"
                id="chat-manage-menu-btn"
                onClick={() => {
                  setShowManageMenu((v) => !v);
                  setConfirmClearChat(false);
                }}
                className="p-2 rounded-xl liquid-glass-subtle hover:bg-blue-500/15 text-slate-700 dark:text-slate-200 transition cursor-pointer active:scale-95"
                title="Chat boshqaruvi"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showManageMenu && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl liquid-glass border border-slate-200/80 dark:border-white/15 shadow-2xl p-2 space-y-1 z-50 animate-in fade-in duration-150">
                  <div className="px-3 py-1.5 border-b border-slate-200/60 dark:border-white/10">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {selectedChatId === 'general' ? 'Umumiy Chat Boshqaruvi' : 'Shaxsiy Chat Boshqaruvi'}
                    </span>
                  </div>

                  {/* Search inside this chat */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowInChatSearch((v) => !v);
                      setShowManageMenu(false);
                    }}
                    className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-blue-500/15 flex items-center space-x-2.5 transition cursor-pointer"
                  >
                    <Search className="w-4 h-4 text-blue-500" />
                    <span>Xabarlardan qidirish</span>
                  </button>

                  {/* Jump to latest message */}
                  <button
                    type="button"
                    onClick={() => {
                      scrollToBottom('smooth');
                      setShowManageMenu(false);
                    }}
                    className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-blue-500/15 flex items-center space-x-2.5 transition cursor-pointer"
                  >
                    <ArrowDown className="w-4 h-4 text-indigo-500" />
                    <span>Eng oxirgi xabarga o'tish</span>
                  </button>

                  {/* View online users */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowOnlineModal(true);
                      setShowManageMenu(false);
                    }}
                    className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-emerald-500/15 flex items-center justify-between transition cursor-pointer"
                  >
                    <span className="flex items-center space-x-2.5">
                      <Users className="w-4 h-4 text-emerald-500" />
                      <span>Online foydalanuvchilar</span>
                    </span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      {onlineListDisplay.length}
                    </span>
                  </button>

                  {/* Notifications quick setting */}
                  {selectedChatId === 'general' && onToggleGroupChatNotifications ? (
                    <button
                      type="button"
                      onClick={() => {
                        onToggleGroupChatNotifications();
                      }}
                      className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-blue-500/15 flex items-center justify-between transition cursor-pointer"
                    >
                      <span className="flex items-center space-x-2.5">
                        {groupChatNotifications ? (
                          <Bell className="w-4 h-4 text-blue-500" />
                        ) : (
                          <BellOff className="w-4 h-4 text-slate-400" />
                        )}
                        <span>Guruh xabarnomalari</span>
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          groupChatNotifications
                            ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                            : 'bg-slate-500/15 text-slate-500'
                        }`}
                      >
                        {groupChatNotifications ? 'Yoniq' : "O'chiq"}
                      </span>
                    </button>
                  ) : (
                    <div className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                      <span className="flex items-center space-x-2.5">
                        <Bell className="w-4 h-4 text-emerald-500" />
                        <span>Shaxsiy bildirishnoma</span>
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                        Doim yoniq
                      </span>
                    </div>
                  )}

                  <div className="border-t border-slate-200/60 dark:border-white/10 pt-1">
                    {!confirmClearChat ? (
                      <button
                        type="button"
                        onClick={() => setConfirmClearChat(true)}
                        className="w-full px-3 py-2 rounded-xl text-left text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/15 flex items-center space-x-2.5 transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Chat tarixini tozalash</span>
                      </button>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2">
                        <p className="text-[11px] font-semibold text-rose-700 dark:text-rose-300 leading-snug">
                          Faqat sizning hisobingiz uchun bu chat tarixi tozalanadi. Boshqalarda saqlanib qoladi.
                        </p>
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => setConfirmClearChat(false)}
                            className="px-2.5 py-1 rounded-lg liquid-glass-subtle text-[11px] font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
                          >
                            Bekor
                          </button>
                          <button
                            type="button"
                            disabled={isClearingChat}
                            onClick={handleClearChatForMe}
                            className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold cursor-pointer disabled:opacity-50"
                          >
                            {isClearingChat ? 'Tozalanmoqda...' : 'Tozalash'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Optional In-Chat Search Bar */}
        {showInChatSearch && (
          <div className="px-4 py-2.5 border-b border-slate-200/60 dark:border-white/10 liquid-glass-subtle flex items-center space-x-2">
            <Search className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <input
              type="text"
              autoFocus
              value={inChatSearchQuery}
              onChange={(e) => setInChatSearchQuery(e.target.value)}
              placeholder="Ushbu chat ichidan xabar qidirish..."
              className="flex-1 bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => {
                setInChatSearchQuery('');
                setShowInChatSearch(false);
              }}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Message Feed */}
        <div
          ref={feedContainerRef}
          onScroll={handleFeedScroll}
          className="flex-1 p-3.5 sm:p-6 overflow-y-auto space-y-2.5 min-h-0"
        >
          {filteredMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 dark:text-slate-400 space-y-2">
              <div className="w-12 h-12 rounded-2xl liquid-glass-subtle flex items-center justify-center text-slate-500 dark:text-slate-400">
                <MessageCircle className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold">
                {inChatSearchQuery
                  ? "Qidiruv bo'yicha xabar topilmadi"
                  : currentClearedCutoffMs > 0
                  ? 'Siz uchun chat tarixi tozalangan'
                  : "Bu yerda xabarlar yo'q"}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {selectedChatId === 'general'
                  ? "Birinchi bo'lib xabar yoki ovozli xabar yuboring!"
                  : 'Ushbu foydalanuvchiga birinchi shaxsiy xabaringizni yuboring!'}
              </p>
            </div>
          ) : (
            filteredMessages.map((msg, idx) => {
              const isMine = msg.senderId === currentUser.id;
              const isVoice = Boolean(msg.audioUrl);
              const sender = allUsers.find((u) => u.id === msg.senderId);
              const senderAvatar =
                msg.senderAvatar ||
                sender?.avatar ||
                `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(msg.senderName)}`;

              const prevMsg = idx > 0 ? filteredMessages[idx - 1] : null;
              const showDayDivider = !prevMsg || getChatDayKey(prevMsg) !== getChatDayKey(msg);
              const sameSenderAsPrev =
                Boolean(prevMsg) &&
                !showDayDivider &&
                prevMsg!.senderId === msg.senderId &&
                getChatMessageTimestampMs(msg) - getChatMessageTimestampMs(prevMsg!) < 120_000;

              const parsed = parseReplyText(msg.text || '');
              const isPlayingThis = playingAudioId === msg.id;
              const activeDuration =
                isPlayingThis && audioProgress.duration > 0
                  ? audioProgress.duration
                  : msg.audioDuration || 5;
              const progressPct = isPlayingThis
                ? Math.min(100, Math.max(0, (audioProgress.current / (activeDuration || 1)) * 100))
                : 0;

              return (
                <React.Fragment key={msg.id}>
                  {showDayDivider && (
                    <div className="flex items-center justify-center py-2">
                      <span className="px-3 py-1 rounded-full liquid-glass-subtle text-[10px] font-bold text-slate-600 dark:text-slate-300 shadow-xs">
                        {formatChatDayLabel(msg.createdAt)}
                      </span>
                    </div>
                  )}

                  <div
                    className={`group flex flex-col ${isMine ? 'items-end' : 'items-start'} ${
                      sameSenderAsPrev ? 'mt-0.5' : 'mt-2.5'
                    }`}
                  >
                    {!sameSenderAsPrev && (
                      <div
                        className={`flex items-center space-x-2 mb-1 px-1 text-[11px] text-slate-500 dark:text-slate-400 ${
                          isMine ? 'flex-row-reverse space-x-reverse' : ''
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => !isMine && handleOpenDirectChatWithUser(msg.senderId)}
                          title={!isMine ? `${msg.senderName} bilan shaxsiy chat ochish` : undefined}
                          className={`relative rounded-full overflow-hidden flex-shrink-0 transition ${
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
                            isMine
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-slate-800 dark:text-slate-200 cursor-pointer'
                          }`}
                        >
                          {msg.senderName}
                        </button>

                        <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded liquid-glass-subtle text-slate-600 dark:text-slate-300">
                          {msg.senderRole}
                        </span>

                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          {msg.timestamp}
                        </span>
                      </div>
                    )}

                    <div
                      className={`flex items-end gap-1.5 max-w-[92%] sm:max-w-[78%] ${
                        isMine ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      <div
                        className={`p-3 sm:p-3.5 rounded-2xl text-xs sm:text-sm font-medium shadow-sm transition ${
                          isMine
                            ? 'bg-blue-600/95 text-white rounded-tr-xs'
                            : 'liquid-glass-subtle text-slate-900 dark:text-slate-100 rounded-tl-xs'
                        }`}
                      >
                        {/* Quoted Reply Block */}
                        {parsed.replyAuthor && (
                          <div
                            className={`mb-2 px-2.5 py-1.5 rounded-xl border-l-2 text-[11px] ${
                              isMine
                                ? 'bg-white/15 border-white/70 text-blue-50'
                                : 'bg-blue-500/10 border-blue-500 text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            <div className="font-bold text-[10px] opacity-90">
                              {parsed.replyAuthor}
                            </div>
                            <div className="truncate opacity-80">{parsed.replySnippet}</div>
                          </div>
                        )}

                        {msg.attachmentUrl && (
                          <div
                            onClick={() => setPreviewImageUrl(msg.attachmentUrl!)}
                            className="mb-2 rounded-xl overflow-hidden max-h-56 border border-white/20 cursor-zoom-in"
                          >
                            <img
                              src={msg.attachmentUrl}
                              alt="Fayl"
                              className="w-full max-h-56 object-cover"
                            />
                          </div>
                        )}

                        {isVoice ? (
                          <div className="flex items-center space-x-3 py-0.5 min-w-[210px] sm:min-w-[240px]">
                            <button
                              type="button"
                              onClick={() => handlePlayVoice(msg)}
                              className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer shadow-md transition active:scale-95 ${
                                isMine
                                  ? 'bg-white text-blue-600 hover:bg-blue-50'
                                  : 'bg-blue-600 text-white hover:bg-blue-500'
                              }`}
                            >
                              {isPlayingThis ? (
                                <Pause className="w-4 h-4 fill-current" />
                              ) : (
                                <Play className="w-4 h-4 fill-current ml-0.5" />
                              )}
                            </button>

                            <div className="flex-1 space-y-1.5">
                              {/* Seekable Interactive Waveform */}
                              <div
                                className="flex items-center space-x-1 h-5 cursor-pointer"
                                onClick={(e) => {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const frac = Math.max(
                                    0,
                                    Math.min(1, (e.clientX - rect.left) / rect.width)
                                  );
                                  handleSeekVoice(msg, frac);
                                }}
                                title="Oldinga/orqaga surish"
                              >
                                {WAVE_BARS.map((h, bIdx) => {
                                  const barThreshold = ((bIdx + 1) / WAVE_BARS.length) * 100;
                                  const filled = isPlayingThis && progressPct >= barThreshold - 4;
                                  return (
                                    <span
                                      key={bIdx}
                                      className={`w-1 rounded-full transition-all duration-150 ${
                                        isMine
                                          ? filled
                                            ? 'bg-white'
                                            : 'bg-white/40'
                                          : filled
                                          ? 'bg-blue-600 dark:bg-blue-400'
                                          : 'bg-blue-500/30'
                                      }`}
                                      style={{ height: `${h}%` }}
                                    />
                                  );
                                })}
                              </div>

                              <div
                                className={`flex items-center justify-between text-[10px] font-mono ${
                                  isMine
                                    ? 'text-blue-100'
                                    : 'text-slate-500 dark:text-slate-400'
                                }`}
                              >
                                <span>
                                  {isPlayingThis
                                    ? `${formatDuration(audioProgress.current)} / ${formatDuration(activeDuration)}`
                                    : formatDuration(msg.audioDuration || 1)}
                                </span>

                                <button
                                  type="button"
                                  onClick={cyclePlaybackRate}
                                  className={`px-1.5 py-0.2 rounded font-bold cursor-pointer ${
                                    isMine
                                      ? 'bg-white/20 hover:bg-white/30 text-white'
                                      : 'bg-blue-500/15 hover:bg-blue-500/25 text-blue-600 dark:text-blue-400'
                                  }`}
                                  title="Tezlikni o'zgartirish"
                                >
                                  {playbackRate}x
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : editingMsgId === msg.id ? (
                          <div className="space-y-2 min-w-[200px]">
                            <input
                              type="text"
                              autoFocus
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEditMessage(msg);
                                if (e.key === 'Escape') setEditingMsgId(null);
                              }}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-white/20 text-white placeholder:text-white/60 text-xs focus:outline-none border border-white/30"
                            />
                            <div className="flex justify-end space-x-1.5">
                              <button
                                type="button"
                                onClick={() => setEditingMsgId(null)}
                                className="px-2 py-0.5 rounded text-[10px] bg-white/15 cursor-pointer"
                              >
                                Bekor
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveEditMessage(msg)}
                                className="px-2 py-0.5 rounded text-[10px] bg-white text-blue-600 font-bold flex items-center space-x-1 cursor-pointer"
                              >
                                <Check className="w-3 h-3" />
                                <span>Saqlash</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <p className="leading-relaxed whitespace-pre-wrap break-words">
                              {parsed.body}
                            </p>
                            <div
                              className={`flex items-center justify-end space-x-1 text-[9px] ${
                                isMine ? 'text-blue-100/80' : 'text-slate-400'
                              }`}
                            >
                              {msg.isEdited && <span>(tahrirlandi)</span>}
                              {sameSenderAsPrev && <span>{msg.timestamp}</span>}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Quick Bubble Actions (Reply / Edit / Delete) */}
                      <div className="opacity-75 sm:opacity-0 sm:group-hover:opacity-100 transition flex items-center space-x-0.5 flex-shrink-0 pb-1">
                        <button
                          type="button"
                          onClick={() => setReplyTarget(msg)}
                          className="p-1.5 rounded-lg liquid-glass-subtle text-slate-500 hover:text-blue-500 cursor-pointer"
                          title="Javob berish"
                        >
                          <Reply className="w-3 h-3" />
                        </button>

                        {isMine && !isVoice && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingMsgId(msg.id);
                              setEditingText(parsed.body);
                            }}
                            className="p-1.5 rounded-lg liquid-glass-subtle text-slate-500 hover:text-amber-500 cursor-pointer"
                            title="Tahrirlash"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                        )}

                        {isMine && (
                          confirmDeleteMsgId === msg.id ? (
                            <div className="flex items-center space-x-1 px-1.5 py-1 rounded-lg bg-rose-500/20 border border-rose-500/40">
                              <button
                                type="button"
                                onClick={() => {
                                  onDeleteMessage(msg.id);
                                  setConfirmDeleteMsgId(null);
                                }}
                                className="text-[10px] font-bold text-rose-600 dark:text-rose-400 cursor-pointer"
                              >
                                O'chirish
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteMsgId(null)}
                                className="text-[10px] text-slate-500 cursor-pointer"
                              >
                                ×
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteMsgId(msg.id)}
                              className="p-1.5 rounded-lg liquid-glass-subtle text-slate-500 hover:text-rose-500 cursor-pointer"
                              title="Hamma uchun o'chirish"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Floating Jump-to-Latest Button */}
        {showScrollBottomBtn && filteredMessages.length > 0 && (
          <button
            type="button"
            onClick={() => scrollToBottom('smooth')}
            className="absolute bottom-20 right-4 sm:right-6 z-20 px-3 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg flex items-center space-x-1.5 animate-in fade-in cursor-pointer"
          >
            <ArrowDown className="w-3.5 h-3.5" />
            {unseenCount > 0 ? <span>{unseenCount} yangi</span> : <span>Oxiriga</span>}
          </button>
        )}

        {/* Reply preview above input */}
        {replyTarget && (
          <div className="px-4 py-2 liquid-glass-subtle border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-xs gap-3">
            <div className="flex items-center space-x-2 min-w-0 border-l-2 border-blue-500 pl-2.5">
              <Reply className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
              <div className="min-w-0">
                <span className="font-bold text-blue-600 dark:text-blue-400 block text-[11px]">
                  {replyTarget.senderName} ga javob
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate block">
                  {replyTarget.audioUrl
                    ? 'Ovozli xabar'
                    : parseReplyText(replyTarget.text).body || 'Rasm'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setReplyTarget(null)}
              className="text-slate-400 hover:text-rose-500 font-bold cursor-pointer p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

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

        {/* Mic Error notice */}
        {micError && (
          <div className="px-4 py-2 bg-rose-500/10 border-t border-rose-500/30 flex items-center justify-between text-xs text-rose-600 dark:text-rose-400">
            <span className="flex items-center space-x-1.5 font-semibold">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{micError}</span>
            </span>
            <button onClick={() => setMicError('')} className="font-bold cursor-pointer">
              ×
            </button>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-slate-200/60 dark:border-white/10">
          {isRecording ? (
            <div className="flex items-center justify-between p-2 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 animate-in fade-in gap-2">
              <div className="flex items-center space-x-2.5 pl-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping flex-shrink-0" />
                <span className="font-bold text-xs truncate">Ovoz yozilmoqda</span>
                <span className="font-mono text-xs font-black tabular-nums">
                  {formatDuration(recordingDuration)}
                </span>
                <div className="hidden sm:flex items-center space-x-0.5 h-4">
                  {[35, 80, 55, 95, 45, 75, 60].map((h, i) => (
                    <span
                      key={i}
                      className="w-1 rounded-full bg-rose-500 animate-pulse"
                      style={{ height: `${h}%`, animationDelay: `${i * 90}ms` }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2 flex-shrink-0">
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
                title="Rasm biriktirish"
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
                {onlineListDisplay.length} ta online • Barcha a'zolar
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
                const isOnline = onlineUserIds.has(member.id);
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
                    <div className="relative flex-shrink-0">
                      <img
                        src={
                          member.avatar ||
                          `https://api.dicebear.com/7.x/identicon/svg?seed=${member.username}`
                        }
                        alt={member.firstName}
                        className="w-8 h-8 rounded-xl object-cover border border-slate-300 dark:border-white/20"
                      />
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-900 ${
                          isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}
                      />
                    </div>
                    <div className="flex-grow truncate">
                      <h4 className="text-xs font-bold truncate">
                        {member.firstName || member.username} {member.lastName || ''}
                      </h4>
                      <div className="flex items-center space-x-1.5">
                        <span
                          className={`text-[9px] font-semibold ${
                            isSelected
                              ? 'text-blue-100'
                              : isOnline
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {isOnline ? 'Online' : 'Offline'}
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
