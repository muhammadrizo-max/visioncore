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
  AlertCircle
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
      // BroadcastChannel fallback handled by localStorage/API
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
        // silent fallback to local state
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

  // Filter messages for current chat
  const filteredMessages = chats.filter((c) => {
    if (selectedChatId === 'general') {
      return !c.chatId || c.chatId === 'general';
    }
    // Direct private chat between currentUser and selected user
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
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
      chatId: currentChatTarget,
      attachmentUrl: attachmentUrl || undefined
    };

    broadcastMessage(newMsg);
    setInputText('');
    setAttachmentUrl('');
  };

  // Voice message recorder handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          const currentChatTarget = selectedChatId === 'general' 
            ? 'general' 
            : `direct_${currentUser.id}_${selectedChatId}`;

          const newVoiceMsg: ChatMessage = {
            id: `MSG-VOICE-${Date.now()}`,
            senderId: currentUser.id,
            senderName: `${currentUser.firstName || currentUser.username} ${currentUser.lastName || ''}`.trim(),
            senderRole: currentUser.role,
            text: '🎤 Ovozli xabar',
            timestamp: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
            chatId: currentChatTarget,
            audioUrl: base64Audio,
            audioDuration: recordingDuration
          };

          broadcastMessage(newVoiceMsg);
        };
        reader.readAsDataURL(audioBlob);

        // Stop all audio tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err: any) {
      alert("Mikrofondan foydalanishga ruxsat berilmadi yoki mikrofon topilmadi.");
    }
  };

  const stopAndSendRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      setIsRecording(false);
      clearInterval(timerRef.current);
      audioChunksRef.current = [];
    }
  };

  const handlePlayVoice = (msgId: string, url: string) => {
    if (playingAudioId === msgId) {
      audioPlayerRef.current?.pause();
      setPlayingAudioId(null);
      return;
    }

    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }

    const audio = new Audio(url);
    audioPlayerRef.current = audio;
    setPlayingAudioId(msgId);

    audio.onended = () => {
      setPlayingAudioId(null);
    };

    audio.play().catch(() => {
      setPlayingAudioId(null);
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachmentUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="h-[calc(100vh-4.5rem)] flex flex-col md:flex-row overflow-hidden max-w-7xl mx-auto p-2 sm:p-4 gap-3">
      
      {/* LEFT/MAIN CHAT AREA */}
      <div className={`flex-1 flex flex-col rounded-3xl border shadow-sm overflow-hidden ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        
        {/* Chat Header (Clean & modern) */}
        <div className={`p-4 border-b flex items-center justify-between ${
          darkMode ? 'border-slate-800 bg-slate-900/90' : 'border-slate-200 bg-slate-50/70'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
              selectedChatId === 'general'
                ? 'bg-blue-600 text-white'
                : 'bg-indigo-600 text-white'
            }`}>
              {selectedChatId === 'general' ? <Users className="w-5 h-5" /> : (selectedUser?.firstName?.charAt(0) || 'U')}
            </div>

            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <span>{selectedChatId === 'general' ? t.groupChat : (selectedUser?.firstName ? `${selectedUser.firstName} ${selectedUser.lastName || ''}` : selectedUser?.username)}</span>
                {selectedChatId !== 'general' && (
                  <span className="text-[10px] uppercase font-bold px-2 py-0.2 rounded-full bg-blue-500/10 text-blue-500">
                    {selectedUser?.role}
                  </span>
                )}
              </h2>
              <span className="text-[11px] text-slate-400">
                {selectedChatId === 'general' ? `${allUsers.length} ta a'zo faol` : 'Shaxsiy xavfsiz muloqot'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Real-time Faol</span>
            </span>
          </div>
        </div>

        {/* Messages List Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {filteredMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-2 text-slate-400">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Bu yerda xabarlar yo'q</p>
              <p className="text-xs">Birinchi bo'lib xabar yoki ovozli xabar yuboring!</p>
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const isMine = msg.senderId === currentUser.id;
              const isVoice = !!msg.audioUrl;

              return (
                <div 
                  key={msg.id} 
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} space-y-1`}
                >
                  <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 px-1">
                    {!isMine && <span className="font-bold text-slate-700 dark:text-slate-300">{msg.senderName}</span>}
                    {!isMine && <span className="uppercase text-[9px] text-blue-500 font-semibold">({msg.senderRole})</span>}
                    <span>{msg.timestamp}</span>
                  </div>

                  <div className={`p-3.5 rounded-2xl max-w-sm sm:max-w-md text-xs sm:text-sm shadow-sm transition ${
                    isMine 
                      ? 'bg-blue-600 text-white rounded-tr-xs' 
                      : darkMode 
                        ? 'bg-slate-800 text-slate-100 border border-slate-700/80 rounded-tl-xs' 
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
              className="text-slate-400 hover:text-rose-500 font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* Input Bar (Clean, harmonious contrast in light & dark modes) */}
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

      {/* RIGHT SIDEBAR: Chat List (Harmonious contrast matching Image 2 feedback) */}
      <div className={`w-full md:w-72 rounded-3xl border shadow-sm p-4 flex flex-col space-y-4 overflow-y-auto ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        
        {/* General Channel */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2">
            CHATINGIZ RO'YXATI
          </span>
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

        {/* Direct / Private chats with team members */}
        <div className="space-y-1.5 flex-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2">
            SHAXSIY CHATLAR ({allUsers.filter(u => u.id !== currentUser.id).length})
          </span>
          <div className="space-y-1.5">
            {allUsers.filter(u => u.id !== currentUser.id).map((member) => {
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
                  <img src={member.avatar} alt={member.firstName} className="w-8 h-8 rounded-xl object-cover border border-slate-300 dark:border-slate-700" />
                  <div className="flex-grow truncate">
                    <h4 className="text-xs font-bold truncate">
                      {member.firstName || member.username} {member.lastName || ''}
                    </h4>
                    <span className={`text-[9px] uppercase font-bold tracking-wider ${
                      isSelected ? 'text-blue-100' : 'text-blue-500'
                    }`}>
                      {member.role}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};
