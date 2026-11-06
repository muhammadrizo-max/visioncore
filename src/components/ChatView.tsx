import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Paperclip, 
  Mic, 
  Square, 
  Play, 
  Pause, 
  Trash2, 
  CheckCheck, 
  Users, 
  Lock, 
  Smile, 
  Volume2, 
  File, 
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Search,
  UserPlus,
  MessageCircle,
  X
} from 'lucide-react';
import { User, ChatMessage, Language } from '../types';
import { getTranslation } from '../lib/translations';

interface ChatViewProps {
  currentUser: User;
  allUsers: User[];
  chats: ChatMessage[];
  onSendMessage: (msg: ChatMessage) => void;
  onEditMessage: (msgId: string, newText: string) => void;
  onDeleteMessage: (msgId: string) => void;
  darkMode: boolean;
  language?: Language;
}

export const ChatView: React.FC<ChatViewProps> = ({
  currentUser,
  allUsers,
  chats,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  darkMode,
  language = 'uz'
}) => {
  const currentLang: Language = (language as Language) || 'uz';
  const t = getTranslation(currentLang);
  const [selectedChatId, setSelectedChatId] = useState<string>('general');
  const [inputText, setInputText] = useState<string>('');
  const [attachmentUrl, setAttachmentUrl] = useState<string>('');
  
  // Voice recording state
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  // Search User modal / bar state (Point 4)
  const [showSearchModal, setShowSearchModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Cross-tab real-time sync with BroadcastChannel
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('visioncore_live_chats');
      bc.onmessage = (event) => {
        if (event.data && event.data.type === 'NEW_MESSAGE') {
          const msg = event.data.message;
          if (!chats.some(c => c.id === msg.id)) {
            onSendMessage(msg);
          }
        }
      };
    } catch (e) {
      // fallback
    }
    return () => {
      bc?.close();
    };
  }, [chats, onSendMessage]);

  // Periodic server sync for multi-client / multi-device real-time chat
  useEffect(() => {
    const fetchServerChats = async () => {
      try {
        const res = await fetch('/api/chats');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            data.forEach((serverMsg) => {
              if (!chats.some(c => c.id === serverMsg.id)) {
                onSendMessage(serverMsg);
              }
            });
          }
        }
      } catch (err) {
        // silent fallback
      }
    };

    fetchServerChats();
    const interval = setInterval(fetchServerChats, 2500);
    return () => clearInterval(interval);
  }, [chats, onSendMessage]);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats, selectedChatId]);

  // Active direct chats logic: ONLY show users who actually have messages with currentUser (or currently selected user)
  const activeDirectUserIds = Array.from(
    new Set(
      chats
        .filter(c => c.chatId && c.chatId.startsWith('direct_'))
        .flatMap(c => {
          const parts = c.chatId.replace('direct_', '').split('_');
          if (parts[0] === currentUser.id) return [parts[1]];
          if (parts[1] === currentUser.id) return [parts[0]];
          return [];
        })
        .filter(id => id && id !== currentUser.id)
    )
  );

  // If a chat with a specific user was opened via search or avatar click, ensure they appear in the list
  if (selectedChatId !== 'general' && !activeDirectUserIds.includes(selectedChatId)) {
    activeDirectUserIds.unshift(selectedChatId);
  }

  const activeChatUsers = allUsers.filter(u => activeDirectUserIds.includes(u.id));

  // Filter messages for current chat
  const filteredMessages = chats.filter((c) => {
    if (selectedChatId === 'general') {
      return !c.chatId || c.chatId === 'general';
    }
    const directChatId1 = `direct_${currentUser.id}_${selectedChatId}`;
    const directChatId2 = `direct_${selectedChatId}_${currentUser.id}`;
    return c.chatId === directChatId1 || c.chatId === directChatId2;
  });

  const selectedUser = allUsers.find(u => u.id === selectedChatId);

  // Broadcast message to server and other tabs
  const broadcastMessage = (msg: ChatMessage) => {
    onSendMessage(msg);
    try {
      fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msg)
      }).catch(() => {});
    } catch (e) {}

    try {
      const bc = new BroadcastChannel('visioncore_live_chats');
      bc.postMessage({ type: 'NEW_MESSAGE', message: msg });
      bc.close();
    } catch (e) {}
  };

  const handleSendText = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !attachmentUrl) return;

    const currentChatTarget = selectedChatId === 'general' 
      ? 'general' 
      : `direct_${currentUser.id}_${selectedChatId}`;

    const newMsg: ChatMessage = {
      id: `MSG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      senderId: currentUser.id,
      senderName: `${currentUser.firstName || currentUser.username} ${currentUser.lastName || ''}`.trim(),
      senderRole: currentUser.role,
      senderAvatar: currentUser.avatar,
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
      chatId: currentChatTarget,
      attachmentUrl: attachmentUrl || undefined
    };

    broadcastMessage(newMsg);
    setInputText('');
    setAttachmentUrl('');
  };

  // Image Upload handler
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

  // Voice recording handlers
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
    } catch (err) {
      alert("Mikrofondan foydalanishga ruxsat berilmadi yoki qo'llab-quvvatlanmaydi.");
    }
  };

  const stopAndSendRecording = () => {
    if (!mediaRecorderRef.current || !isRecording) return;

    mediaRecorderRef.current.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.onload = () => {
        const base64Audio = reader.result as string;
        const currentChatTarget = selectedChatId === 'general' 
          ? 'general' 
          : `direct_${currentUser.id}_${selectedChatId}`;

        const newMsg: ChatMessage = {
          id: `MSG-VOICE-${Date.now()}`,
          senderId: currentUser.id,
          senderName: `${currentUser.firstName || currentUser.username} ${currentUser.lastName || ''}`.trim(),
          senderRole: currentUser.role,
          senderAvatar: currentUser.avatar,
          text: '🎤 Ovozli xabar',
          timestamp: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
          chatId: currentChatTarget,
          audioUrl: base64Audio,
          audioDuration: recordingDuration || 1
        };

        broadcastMessage(newMsg);
      };
      reader.readAsDataURL(audioBlob);

      mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    };

    mediaRecorderRef.current.stop();
    setIsRecording(false);
    clearInterval(timerRef.current);
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
    setIsRecording(false);
    clearInterval(timerRef.current);
    audioChunksRef.current = [];
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

  // Switch to direct private chat by clicking user avatar / name
  const handleOpenDirectChatWithUser = (userId: string) => {
    if (userId === currentUser.id) return;
    setSelectedChatId(userId);
    setShowSearchModal(false);
  };

  // Filter search results
  const searchResults = searchQuery.trim()
    ? allUsers.filter(u => {
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

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col md:flex-row gap-6 max-w-7xl mx-auto">
      
      {/* Search User Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className={`relative w-full max-w-md p-6 rounded-3xl border shadow-2xl space-y-4 ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
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
              <label className="text-xs font-semibold text-slate-500">
                12 xonali ID yoki Foydalanuvchi nomi (username)
              </label>
              <div className="relative">
                <input
                  type="text"
                  autoFocus
                  placeholder="Masalan: vcg_78728082 yoki vcg-creator"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Results list */}
            <div className="space-y-2 max-h-60 overflow-y-auto pt-1">
              {searchQuery.trim() && searchResults.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">
                  Bunday ID yoki nomli foydalanuvchi topilmadi
                </p>
              ) : (
                searchResults.map(foundUser => (
                  <div
                    key={foundUser.id}
                    className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50"
                  >
                    <div className="flex items-center space-x-3">
                      <img 
                        src={foundUser.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${foundUser.username}`} 
                        alt={foundUser.username} 
                        className="w-9 h-9 rounded-xl object-cover border border-slate-300 dark:border-slate-700"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          {foundUser.firstName || foundUser.username} {foundUser.lastName || ''}
                        </h4>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-mono font-bold text-blue-500">
                            {foundUser.id}
                          </span>
                          <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
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

      {/* LEFT/CENTER: Active Chat Conversation Box */}
      <div className={`flex-1 rounded-3xl border shadow-sm flex flex-col overflow-hidden ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        
        {/* Chat Header */}
        <div className={`p-4 border-b flex items-center justify-between ${
          darkMode ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shadow-md ${
              selectedChatId === 'general' ? 'bg-blue-600' : 'bg-purple-600'
            }`}>
              {selectedChatId === 'general' ? <Users className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {selectedChatId === 'general' 
                  ? t.groupChat 
                  : `${selectedUser?.firstName || selectedUser?.username || 'Foydalanuvchi'} (Shaxsiy Chat)`}
              </h2>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {selectedChatId === 'general' 
                    ? `Umumiy guruh | ${allUsers.length} ta a'zo faol` 
                    : `ID: ${selectedUser?.id || selectedChatId}`}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSearchModal(true)}
              className="px-3 py-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ID orqali qidirish</span>
            </button>
            <div className="hidden sm:inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Real-time Faol</span>
            </div>
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
          {filteredMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <MessageCircle className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold">{t.noMessages}</p>
              <p className="text-[11px] text-slate-500">
                {selectedChatId === 'general' 
                  ? 'Birinchi bo\'lib xabar yoki ovozli xabar yuboring!'
                  : 'Ushbu foydalanuvchiga birinchi shaxsiy xabaringizni yuboring!'}
              </p>
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const isMine = msg.senderId === currentUser.id;
              const isVoice = Boolean(msg.audioUrl);
              const sender = allUsers.find(u => u.id === msg.senderId);
              const senderAvatar = msg.senderAvatar || sender?.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${msg.senderName}`;

              return (
                <div 
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  {/* Sender Header with Profile Avatar (Point 4) */}
                  <div className={`flex items-center space-x-2 mb-1 px-1 text-[11px] text-slate-400 ${isMine ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    
                    {/* Clickable Profile Avatar to initiate Direct Chat */}
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
                        className="w-5 h-5 rounded-full object-cover border border-slate-300 dark:border-slate-700"
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() => !isMine && handleOpenDirectChatWithUser(msg.senderId)}
                      className={`font-semibold hover:underline ${
                        isMine ? 'text-blue-500' : 'text-slate-700 dark:text-slate-200 cursor-pointer'
                      }`}
                      title={!isMine ? "Shaxsiy xabar yozish" : undefined}
                    >
                      {msg.senderName}
                    </button>

                    <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-500">
                      {msg.senderRole}
                    </span>

                    {/* Sender ID badge */}
                    {sender && (
                      <span className="text-[9px] font-mono text-slate-400">
                        ({sender.id})
                      </span>
                    )}

                    <span className="text-[10px] text-slate-400">
                      {msg.timestamp}
                    </span>
                  </div>

                  {/* Message Bubble */}
                  <div className={`max-w-[85%] sm:max-w-md p-3.5 rounded-2xl text-xs sm:text-sm font-medium shadow-sm transition ${
                    isMine 
                      ? 'bg-blue-600 text-white rounded-tr-xs' 
                      : darkMode 
                        ? 'bg-slate-800 text-slate-100 border border-slate-700/60 rounded-tl-xs' 
                        : 'bg-slate-100 text-slate-800 border border-slate-200 rounded-tl-xs'
                  }`}>
                    
                    {/* Attachment preview if exists */}
                    {msg.attachmentUrl && (
                      <div className="mb-2 rounded-xl overflow-hidden max-h-48 border border-white/20">
                        <img src={msg.attachmentUrl} alt="Fayl" className="w-full object-cover" />
                      </div>
                    )}

                    {/* Voice Message Bubble Player */}
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
                          <div className={`text-[10px] font-mono ${isMine ? 'text-blue-100' : 'text-slate-400'}`}>
                            {msg.audioDuration ? `${Math.floor(msg.audioDuration / 60)}:${(msg.audioDuration % 60).toString().padStart(2, '0')}` : '0:05'}
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
          <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-blue-500 font-semibold flex items-center space-x-1">
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
        <div className={`p-3 sm:p-4 border-t ${
          darkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
        }`}>
          {isRecording ? (
            /* Active Voice Recording UI */
            <div className="flex items-center justify-between p-2 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 animate-in fade-in">
              <div className="flex items-center space-x-2 pl-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping"></span>
                <span className="font-bold text-xs">{t.recording}</span>
                <span className="font-mono text-xs font-black">
                  {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={cancelRecording}
                  className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-300 cursor-pointer"
                >
                  {t.cancelVoice}
                </button>
                <button
                  type="button"
                  onClick={stopAndSendRecording}
                  className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center space-x-1 shadow-md cursor-pointer"
                >
                  <Square className="w-3 h-3 fill-current" />
                  <span>{t.pressToStop}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Normal Input Bar */
            <form onSubmit={handleSendText} className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-slate-800 transition cursor-pointer"
                title={t.attachFile}
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
                placeholder={t.sendMessage}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-grow px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition"
              />

              {/* Voice record trigger button */}
              <button
                type="button"
                onClick={startRecording}
                className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-500 hover:text-rose-500 bg-slate-50 dark:bg-slate-800 transition cursor-pointer"
                title={t.recordVoice}
              >
                <Mic className="w-4 h-4" />
              </button>

              {/* Send button */}
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

      {/* RIGHT SIDEBAR: Chat List (Only active conversations, Point 4) */}
      <div className={`w-full md:w-72 rounded-3xl border shadow-sm p-4 flex flex-col space-y-4 overflow-y-auto ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        
        {/* General Channel */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              CHATINGIZ RO'YXATI
            </span>
            <button
              onClick={() => setShowSearchModal(true)}
              className="text-[11px] font-bold text-blue-500 hover:underline flex items-center space-x-1 cursor-pointer"
              title="Foydalanuvchi qidirish"
            >
              <Search className="w-3 h-3" />
              <span>Qidiruv</span>
            </button>
          </div>

          <button
            onClick={() => setSelectedChatId('general')}
            className={`w-full p-3 rounded-2xl flex items-center space-x-3 transition cursor-pointer text-left ${
              selectedChatId === 'general'
                ? 'bg-blue-600 text-white shadow-md'
                : darkMode
                  ? 'bg-slate-800/60 hover:bg-slate-800 text-slate-200'
                  : 'bg-slate-100 hover:bg-slate-200/70 text-slate-800'
            }`}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
              selectedChatId === 'general' ? 'bg-white/20 text-white' : 'bg-blue-600/10 text-blue-600'
            }`}>
              <Users className="w-4 h-4" />
            </div>
            <div className="flex-grow truncate">
              <h4 className="text-xs font-bold truncate">{t.groupChat}</h4>
              <p className={`text-[10px] truncate ${selectedChatId === 'general' ? 'text-blue-100' : 'text-slate-400'}`}>
                Barcha a'zolar bilan suhbat
              </p>
            </div>
          </button>
        </div>

        {/* Direct / Private chats: ONLY appear when users actually chat (Point 4) */}
        <div className="space-y-1.5 flex-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block">
            SHAXSIY CHATLAR ({activeChatUsers.length})
          </span>

          {activeChatUsers.length === 0 ? (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-center space-y-2">
              <p className="text-[11px] text-slate-400">
                Hozircha shaxsiy chatlar yo'q.
              </p>
              <button
                type="button"
                onClick={() => setShowSearchModal(true)}
                className="w-full py-2 rounded-xl bg-blue-600/10 hover:bg-blue-600 text-blue-600 dark:text-blue-400 hover:text-white text-xs font-bold transition flex items-center justify-center space-x-1 cursor-pointer"
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
                    onClick={() => setSelectedChatId(member.id)}
                    className={`w-full p-2.5 rounded-2xl flex items-center space-x-3 transition cursor-pointer text-left ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md'
                        : darkMode
                          ? 'bg-slate-800/40 hover:bg-slate-800 text-slate-200'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <img 
                      src={member.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${member.username}`} 
                      alt={member.firstName} 
                      className="w-8 h-8 rounded-xl object-cover border border-slate-300 dark:border-slate-700" 
                    />
                    <div className="flex-grow truncate">
                      <h4 className="text-xs font-bold truncate">
                        {member.firstName || member.username} {member.lastName || ''}
                      </h4>
                      <div className="flex items-center space-x-1.5">
                        <span className={`text-[9px] font-mono ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                          {member.id}
                        </span>
                        <span className={`text-[9px] uppercase font-bold tracking-wider ${
                          isSelected ? 'text-blue-100' : 'text-blue-500'
                        }`}>
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
