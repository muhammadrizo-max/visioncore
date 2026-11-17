import React, { useState, useRef } from 'react';
import {
  Megaphone,
  Send,
  Users,
  UserCheck,
  User as UserIcon,
  Globe,
  Image as ImageIcon,
  Trash2,
  Search,
  CheckCircle2,
  X
} from 'lucide-react';
import { BroadcastMessage, BroadcastTarget, User } from '../types';
import { readImageFileFromGallery } from '../lib/imageUtils';

interface BroadcastViewProps {
  currentUser: User;
  allUsers: User[];
  broadcasts: BroadcastMessage[];
  onSendBroadcast: (broadcast: BroadcastMessage) => void;
  onDeleteBroadcast: (id: string) => void;
}

export const BroadcastView: React.FC<BroadcastViewProps> = ({
  currentUser,
  allUsers,
  broadcasts,
  onSendBroadcast,
  onDeleteBroadcast
}) => {
  const [targetType, setTargetType] = useState<BroadcastTarget>('all');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [userSearch, setUserSearch] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [sentNotice, setSentNotice] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const teamMembers = allUsers.filter((u) => u.role !== 'user' && u.id !== currentUser.id);
  const regularUsers = allUsers.filter((u) => u.role === 'user');
  const selectableRecipients = allUsers.filter((u) => u.id !== currentUser.id);

  const filteredRecipients = selectableRecipients.filter((u) => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      u.username.toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q) ||
      (u.firstName && u.firstName.toLowerCase().includes(q)) ||
      (u.lastName && u.lastName.toLowerCase().includes(q))
    );
  });

  const handleGalleryImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await readImageFileFromGallery(file, 1200, 0.82);
      setImageUrl(compressed);
    } catch {
      // ignore error
    }
    e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    if (targetType === 'single' && !selectedUserId) return;

    const targetObj = targetType === 'single' ? allUsers.find((u) => u.id === selectedUserId) : undefined;

    const newBroadcast: BroadcastMessage = {
      id: `BC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: title.trim() || 'Creator Xabarnomasi',
      message: message.trim(),
      imageUrl: imageUrl || undefined,
      targetType,
      targetUserId: targetType === 'single' ? selectedUserId : undefined,
      targetUserName: targetObj ? `${targetObj.firstName || targetObj.username} (${targetObj.id})` : undefined,
      senderId: currentUser.id,
      senderName: `${currentUser.firstName || currentUser.username} ${currentUser.lastName || ''}`.trim(),
      createdAt: new Date().toISOString(),
      readByUserIds: []
    };

    onSendBroadcast(newBroadcast);
    setTitle('');
    setMessage('');
    setImageUrl('');
    setSentNotice('Xabar muvaffaqiyatli yuborildi!');
    setTimeout(() => setSentNotice(''), 3000);
  };

  const getTargetLabel = (bc: BroadcastMessage) => {
    switch (bc.targetType) {
      case 'all':
        return 'Barchaga (A\'zolar va Userlar)';
      case 'members':
        return 'Faqat Guruh A\'zolariga';
      case 'users':
        return 'Faqat Oddiy Userlarga';
      case 'single':
        return `Shaxsiy: ${bc.targetUserName || bc.targetUserId}`;
      default:
        return 'Barchaga';
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wider">
            <Megaphone className="w-4 h-4" />
            <span>Creator Broadcast Markazi</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Ommaviy va Manzilga Xabar Yuborish (Broadcast)
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Barchaga, faqat guruh a'zolariga, faqat userlarga yoki bitta tanlangan shaxsga tezkor xabar yuboring
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold">
          <span className="px-3 py-1.5 rounded-xl liquid-glass-subtle text-blue-600 dark:text-blue-400">
            A'zolar: {teamMembers.length} ta
          </span>
          <span className="px-3 py-1.5 rounded-xl liquid-glass-subtle text-emerald-600 dark:text-emerald-400">
            Userlar: {regularUsers.length} ta
          </span>
        </div>
      </div>

      {sentNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{sentNotice}</span>
        </div>
      )}

      {/* Compose Broadcast Card */}
      <form onSubmit={handleSubmit} className="p-6 rounded-3xl liquid-glass space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            1. Qabul qiluvchini tanlang
          </label>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { id: 'all' as BroadcastTarget, label: 'Barchaga', desc: 'A\'zolar + Userlar', icon: Globe },
              { id: 'members' as BroadcastTarget, label: 'Guruh A\'zolariga', desc: `${teamMembers.length} ta a'zo`, icon: UserCheck },
              { id: 'users' as BroadcastTarget, label: 'Oddiy Userlarga', desc: `${regularUsers.length} ta user`, icon: Users },
              { id: 'single' as BroadcastTarget, label: 'Bitta Odamga', desc: 'Aniq 1 ta shaxs', icon: UserIcon }
            ].map((opt) => {
              const Icon = opt.icon;
              const active = targetType === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTargetType(opt.id)}
                  className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                    active
                      ? 'border-blue-500 bg-blue-600/15 ring-1 ring-blue-500'
                      : 'liquid-glass-subtle hover:border-blue-500/40'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <Icon className={`w-4 h-4 ${active ? 'text-blue-500' : 'text-slate-500 dark:text-slate-400'}`} />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{opt.label}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{opt.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Single recipient picker */}
        {targetType === 'single' && (
          <div className="p-4 rounded-2xl liquid-glass-subtle space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Aniq qabul qiluvchini tanlang:
              </label>
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Ism, username yoki ID..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl liquid-glass text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {selectableRecipients.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-2">
                Hozircha boshqa foydalanuvchi yoki a'zo mavjud emas.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                {filteredRecipients.map((u) => {
                  const isSelected = selectedUserId === u.id;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setSelectedUserId(u.id)}
                      className={`p-2.5 rounded-xl border flex items-center space-x-2.5 text-left transition cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                          : 'liquid-glass text-slate-800 dark:text-slate-200 hover:border-blue-500/40'
                      }`}
                    >
                      <img
                        src={u.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${u.username}`}
                        alt={u.username}
                        className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold truncate">
                          {u.firstName || u.username} {u.lastName || ''}
                        </div>
                        <div className={`text-[10px] font-mono truncate ${isSelected ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>
                          @{u.username} • {u.role.toUpperCase()}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Title & Message */}
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Sarlavha (ixtiyoriy)
            </label>
            <input
              type="text"
              placeholder="Masalan: Yangi loyiha tartibi yoki muhim e'lon"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl liquid-glass-subtle text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Xabar matni
            </label>
            <textarea
              rows={4}
              required
              placeholder="Barcha yoki tanlangan foydalanuvchilar uchun xabar matnini yozing..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl liquid-glass-subtle text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>
        </div>

        {/* Optional Gallery Image */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center space-x-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleGalleryImagePick}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-xl liquid-glass-subtle text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-blue-500/40 flex items-center space-x-2 cursor-pointer transition"
            >
              <ImageIcon className="w-4 h-4 text-blue-500" />
              <span>Galereyadan rasm biriktirish</span>
            </button>

            {imageUrl && (
              <div className="relative inline-flex items-center space-x-2 p-1 rounded-xl liquid-glass-subtle">
                <img src={imageUrl} alt="Preview" className="w-10 h-10 rounded-lg object-cover" />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="p-1 text-rose-500 hover:bg-rose-500/15 rounded-lg cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!message.trim() || (targetType === 'single' && !selectedUserId)}
            className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm transition shadow-lg flex items-center space-x-2 active:scale-95 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Xabarni Yuborish</span>
          </button>
        </div>
      </form>

      {/* Sent Broadcasts History */}
      <div className="p-6 rounded-3xl liquid-glass space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
          Yuborilgan Broadcast Xabarlar Tarixi ({broadcasts.length})
        </h3>

        {broadcasts.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
            Hozircha yuborilgan broadcast xabarlar yo'q.
          </div>
        ) : (
          <div className="space-y-3">
            {broadcasts.map((bc) => (
              <div key={bc.id} className="p-4 rounded-2xl liquid-glass-subtle space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                        {bc.title}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                        {getTargetLabel(bc)}
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        {(bc.readByUserIds || []).length} kishi o'qidi
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      {new Date(bc.createdAt).toLocaleString('uz-UZ')}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteBroadcast(bc.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                    title="O'chirish"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {bc.imageUrl && (
                  <img
                    src={bc.imageUrl}
                    alt={bc.title}
                    className="max-h-44 rounded-xl object-cover border border-white/15"
                  />
                )}

                <p className="text-xs text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {bc.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
