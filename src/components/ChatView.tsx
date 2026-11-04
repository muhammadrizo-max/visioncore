import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Users, Lock, FileText, Download, Edit2, Trash2, Check, X } from 'lucide-react';
import { User, ChatMessage } from '../types';
import { getTranslation } from '../lib/translations';

interface ChatViewProps {
  currentUser: User;
  allUsers: User[];
  chats: ChatMessage[];
  onSendMessage: (msg: ChatMessage) => void;
  onEditMessage?: (msgId: string, newText: string) => void;
  onDeleteMessage?: (msgId: string) => void;
  darkMode: boolean;
}

export const ChatView: React.FC<ChatViewProps> = ({
  currentUser,
  allUsers,
  chats,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  darkMode
}) => {
  const t = getTranslation(currentUser.language || 'uz');

  // Active chat ID: 'group-all' or sorted user-to-user ID pair
  const [selectedChatId, setSelectedChatId] = useState<string>('group-all');
  const [messageText, setMessageText] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState<string | undefined>(undefined);
  
  // State for message editing inline
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getPairChatId = (user1Id: string, user2Id: string) => {
    return [user1Id, user2Id].sort().join('-PRIVATE-');
  };

  // Only real registered members on the site
  const validRealMembers = allUsers.filter(u => u && u.id && u.id !== currentUser.id && u.username);

  // Filter messages for current selected chat
  const currentMessages = chats.filter(m => {
    if (selectedChatId === 'group-all') {
      return m.chatId === 'group-all';
    }
    return m.chatId === selectedChatId;
  });

  // Auto scroll to bottom when new message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages.length]);

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

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() && !attachmentUrl) return;

    const newMsg: ChatMessage = {
      id: `MSG-${Date.now()}`,
      senderId: currentUser.id,
      senderName: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.username,
      senderRole: currentUser.role,
      text: messageText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      chatId: selectedChatId,
      attachmentUrl
    };

    onSendMessage(newMsg);
    setMessageText('');
    setAttachmentUrl(undefined);
  };

  const startEdit = (msg: ChatMessage) => {
    setEditingMsgId(msg.id);
    setEditingText(msg.text);
  };

  const cancelEdit = () => {
    setEditingMsgId(null);
    setEditingText('');
  };

  const saveEdit = (msgId: string) => {
    if (!editingText.trim()) return;
    if (onEditMessage) {
      onEditMessage(msgId, editingText.trim());
    }
    setEditingMsgId(null);
    setEditingText('');
  };

  const handleDelete = (msgId: string) => {
    if (confirm("Ushbu xabarni o'chirishni tasdiqlaysizmi?")) {
      if (onDeleteMessage) {
        onDeleteMessage(msgId);
      }
    }
  };

  // Determine chat target title
  const activeChatPartner = validRealMembers.find(
    u => getPairChatId(currentUser.id, u.id) === selectedChatId
  );

  return (
    <div className="h-[calc(100vh-73px)] flex flex-col md:flex-row overflow-hidden">
      
      {/* Middle: Active Chat Window */}
      <div className={`flex-grow flex flex-col justify-between ${
        darkMode ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-800'
      }`}>
        
        {/* Chat Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center space-x-3">
            {selectedChatId === 'group-all' ? (
              <div className="w-10 h-10 rounded-2xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-500">
                <Users className="w-5 h-5" />
              </div>
            ) : (
              <img 
                src={activeChatPartner?.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${activeChatPartner?.username || 'user'}`} 
                alt="Partner"
                className="w-10 h-10 rounded-2xl object-cover border border-blue-500/30"
              />
            )}

            <div>
              <h2 className="text-sm font-bold">
                {selectedChatId === 'group-all' 
                  ? t.groupChat 
                  : `${activeChatPartner?.firstName || activeChatPartner?.username} ${activeChatPartner?.lastName || ''}`}
              </h2>
              <p className="text-[10px] text-slate-400">
                {selectedChatId === 'group-all' 
                  ? `${allUsers.length} ta a'zo faol` 
                  : `${activeChatPartner?.role?.toUpperCase() || "A'ZO"} (Maxfiy chat)`}
              </p>
            </div>
          </div>

          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
            Shifrlangan (E2E)
          </span>
        </div>

        {/* Message Stream */}
        <div className="flex-grow p-6 overflow-y-auto space-y-4">
          {currentMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs space-y-2">
              <Lock className="w-8 h-8 text-blue-500/40" />
              <p>Muloqotni boshlash uchun ilk xabarni yuboring.</p>
            </div>
          ) : (
            currentMessages.map((msg) => {
              const isMe = msg.senderId === currentUser.id;
              const canEditOrDelete = isMe || currentUser.role === 'engineer';
              const isEditingThis = editingMsgId === msg.id;

              return (
                <div 
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}
                >
                  <div className="text-[10px] text-slate-400 px-1 mb-1 flex items-center space-x-1">
                    <span className="font-semibold">{msg.senderName}</span>
                    <span className="uppercase text-[9px] text-blue-500">({msg.senderRole})</span>
                  </div>

                  <div className={`relative max-w-md p-4 rounded-2xl text-xs space-y-2 shadow-sm ${
                    isMe
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : darkMode
                        ? 'bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-none'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                  }`}>
                    
                    {/* Action buttons (Edit & Delete) for author or engineer */}
                    {canEditOrDelete && !isEditingThis && (
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition flex items-center space-x-1 bg-slate-950/70 p-1 rounded-lg backdrop-blur-sm z-10">
                        <button
                          onClick={() => startEdit(msg)}
                          className="p-1 hover:text-blue-400 text-slate-300 transition"
                          title="Tahrirlash"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(msg.id)}
                          className="p-1 hover:text-red-400 text-slate-300 transition"
                          title="O'chirish"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {/* Inline Edit UI or Standard Message Text */}
                    {isEditingThis ? (
                      <div className="space-y-2 pt-1">
                        <textarea
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="w-full p-2 text-xs bg-slate-800 border border-blue-400 rounded-lg text-white focus:outline-none"
                          rows={2}
                        />
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={cancelEdit}
                            className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-white text-[10px] flex items-center space-x-1"
                          >
                            <X className="w-3 h-3" />
                            <span>Bekor qilish</span>
                          </button>
                          <button
                            onClick={() => saveEdit(msg.id)}
                            className="p-1 px-2 rounded bg-green-600 hover:bg-green-500 text-white text-[10px] font-bold flex items-center space-x-1"
                          >
                            <Check className="w-3 h-3" />
                            <span>Saqlash</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      msg.text && (
                        <p className="whitespace-pre-wrap leading-relaxed pr-6">
                          {msg.text}
                          {msg.isEdited && (
                            <span className="ml-2 text-[9px] text-blue-200 italic">(tahrirlandi)</span>
                          )}
                        </p>
                      )
                    )}

                    {msg.attachmentUrl && (
                      <div className="pt-2">
                        {msg.attachmentUrl.startsWith('data:image') ? (
                          <img 
                            src={msg.attachmentUrl} 
                            alt="Attachment" 
                            className="max-h-60 rounded-xl object-cover border border-white/20"
                          />
                        ) : (
                          <a
                            href={msg.attachmentUrl}
                            download="fayl"
                            className="inline-flex items-center space-x-2 p-2 rounded-xl bg-black/20 hover:bg-black/30 text-white text-[11px] font-medium"
                          >
                            <FileText className="w-4 h-4" />
                            <span>Yuklab olish</span>
                            <Download className="w-3.5 h-3.5 ml-1" />
                          </a>
                        )}
                      </div>
                    )}

                    <div className={`text-[9px] text-right ${isMe ? 'text-blue-200' : 'text-slate-400'}`}>
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Attachment preview if selected */}
        {attachmentUrl && (
          <div className="px-6 py-2 bg-blue-500/10 border-t border-blue-500/20 flex items-center justify-between text-xs text-blue-400">
            <span className="flex items-center space-x-2">
              <Paperclip className="w-4 h-4" />
              <span>Fayl biriktirildi</span>
            </span>
            <button 
              onClick={() => setAttachmentUrl(undefined)}
              className="font-bold text-red-400 hover:underline"
            >
              O'chirish
            </button>
          </div>
        )}

        {/* Input Bar */}
        <form onSubmit={handleSend} className={`p-4 border-t flex items-center space-x-3 ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
          />

          <button
            id="chat-attach-btn"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition flex-shrink-0"
            title={t.attachFile}
          >
            <Paperclip className="w-5 h-5" />
          </button>

          <input 
            id="chat-message-input"
            type="text"
            placeholder={t.sendMessage}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            className="flex-grow px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 text-xs focus:outline-none transition"
          />

          <button
            id="chat-send-btn"
            type="submit"
            className="p-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white transition shadow-md active:scale-95 flex items-center justify-center flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>

      </div>

      {/* Right Side: Chat List (Umumiy guruh + Shaxsiy chatlar) */}
      <div className={`w-full md:w-80 border-l flex flex-col ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
      }`}>
        
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 font-bold text-xs uppercase tracking-wider text-slate-400">
          Chatingiz ro'yxati
        </div>

        <div className="p-3 space-y-2 flex-grow overflow-y-auto">
          
          {/* Group Chat Button */}
          <button
            id="chat-group-tab-btn"
            onClick={() => setSelectedChatId('group-all')}
            className={`w-full p-3 rounded-2xl border text-left flex items-center space-x-3 transition active:scale-98 ${
              selectedChatId === 'group-all'
                ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
              selectedChatId === 'group-all' ? 'bg-white/20 text-white' : 'bg-blue-500/10 text-blue-500'
            }`}>
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold">{t.groupChat}</h3>
              <p className={`text-[10px] ${selectedChatId === 'group-all' ? 'text-blue-100' : 'text-slate-400'}`}>
                Barcha a'zolar bilan suhbat
              </p>
            </div>
          </button>

          <div className="pt-4 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2">
            {t.secretChats} ({validRealMembers.length})
          </div>

          {/* Individual Member Secret Chats - Only real members */}
          {validRealMembers.length === 0 ? (
            <p className="text-[11px] text-slate-500 px-2 py-3 italic">
              Saytda hozircha boshqa a'zolar mavjud emas. Yangi a'zolar qo'shilishi bilan shu yerda ko'rinadi.
            </p>
          ) : (
            validRealMembers.map((member) => {
              const pairId = getPairChatId(currentUser.id, member.id);
              const isSelected = selectedChatId === pairId;

              return (
                <button
                  key={member.id}
                  id={`chat-private-tab-${member.id.toLowerCase()}`}
                  onClick={() => setSelectedChatId(pairId)}
                  className={`w-full p-3 rounded-2xl border text-left flex items-center space-x-3 transition active:scale-98 ${
                    isSelected
                      ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                      : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <img 
                    src={member.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${member.username}`} 
                    alt={member.firstName || member.username}
                    className="w-10 h-10 rounded-xl object-cover border border-slate-300 dark:border-slate-700" 
                  />
                  <div className="flex-grow overflow-hidden">
                    <h3 className="text-xs font-bold truncate">
                      {member.firstName || member.username} {member.lastName || ''}
                    </h3>
                    <p className={`text-[10px] uppercase font-semibold ${
                      isSelected ? 'text-blue-200' : 'text-blue-500'
                    }`}>
                      {member.role || 'user'}
                    </p>
                  </div>
                </button>
              );
            })
          )}

        </div>

      </div>

    </div>
  );
};
