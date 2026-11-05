import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  Rocket, 
  AlertCircle, 
  Phone, 
  Send, 
  ExternalLink, 
  UserCheck, 
  Calendar, 
  DollarSign, 
  FileText,
  User as UserIcon
} from 'lucide-react';
import { Order, OrderStatus, User, Language } from '../types';
import { getTranslation } from '../lib/translations';

interface OrdersManagementViewProps {
  orders: Order[];
  allUsers: User[];
  currentUser: User;
  onUpdateOrder: (updatedOrder: Order) => void;
  darkMode: boolean;
  language?: Language;
}

export const OrdersManagementView: React.FC<OrdersManagementViewProps> = ({
  orders,
  allUsers,
  currentUser,
  onUpdateOrder,
  darkMode,
  language = 'uz'
}) => {
  const currentLang: Language = (language as Language) || 'uz';
  const t = getTranslation(currentLang);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [adminNoteText, setAdminNoteText] = useState<string>('');

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery = !q || 
      o.projectName.toLowerCase().includes(q) || 
      o.clientName.toLowerCase().includes(q) || 
      o.id.toLowerCase().includes(q) || 
      o.clientTelegram.toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });

  const handleStatusChange = (order: Order, newStatus: OrderStatus) => {
    const updated: Order = {
      ...order,
      status: newStatus,
      // If accepting for the first time, record who accepted
      acceptedById: order.acceptedById || currentUser.id,
      acceptedByName: order.acceptedByName || `${currentUser.firstName} ${currentUser.lastName || ''}`.trim()
    };
    onUpdateOrder(updated);
  };

  const handleAssignMember = (order: Order, memberId: string) => {
    const member = allUsers.find(u => u.id === memberId);
    const updated: Order = {
      ...order,
      assignedMemberId: memberId || undefined,
      assignedMemberName: member ? `${member.firstName} ${member.lastName || ''}`.trim() : undefined
    };
    onUpdateOrder(updated);
  };

  const handleSaveNotes = (order: Order) => {
    const updated: Order = {
      ...order,
      adminNotes: adminNoteText
    };
    onUpdateOrder(updated);
    setEditingNotesId(null);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wider">
            <ShoppingBag className="w-4 h-4" />
            <span>Mijozlar Buyurtmalari Markazi</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {t.clientOrders} ({orders.length})
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Foydalanuvchilardan kelgan loyiha arizalari, statuslar, javobgar mutaxassislar va bevosita aloqa
          </p>
        </div>

        {/* Status Counters */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold">
            {orders.filter(o => o.status === 'pending').length} yangi kutilmoqda
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-600 dark:text-purple-400 font-bold">
            {orders.filter(o => o.status === 'in_progress').length} jarayonda
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className={`p-4 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between`}>
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input 
            type="text"
            placeholder="Loyiha nomi, mijoz yoki @username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Status Filter buttons */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto pb-1">
          {[
            { id: 'all', label: 'Barchasi' },
            { id: 'pending', label: 'Kutilmoqda' },
            { id: 'in_review', label: 'Ko\'rib chiqilmoqda' },
            { id: 'accepted', label: 'Qabul qilindi' },
            { id: 'in_progress', label: 'Jarayonda' },
            { id: 'completed', label: 'Bajarildi' },
            { id: 'cancelled', label: 'Bekor' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setStatusFilter(item.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                statusFilter === item.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List (Matching Image 6 layout & styles) */}
      {filteredOrders.length === 0 ? (
        <div className={`p-12 text-center rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} space-y-3`}>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 mx-auto flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Buyurtmalar mavjud emas</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Hozircha mijozlar tomonidan yangi buyurtmalar qoldirilmagan. Saytdagi "Buyurtma berish" bo'limi orqali yuborilgan har bir ariza shu yerda paydo bo'ladi.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredOrders.map((order) => {
            const cleanTelegram = order.clientTelegram.replace(/^@/, '');
            const cleanPhone = order.clientPhone.replace(/\s+/g, '');
            const isEditingNote = editingNotesId === order.id;

            return (
              <div
                key={order.id}
                className={`p-5 sm:p-6 rounded-3xl border transition shadow-sm space-y-4 ${
                  darkMode ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                
                {/* Header Row: ID, Project Name, Tag, Status selector (Matches Image 6) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3.5">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg bg-blue-600/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 font-mono text-xs font-bold">
                        {order.id}
                      </span>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">
                        {order.projectName}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">
                        {order.projectType.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>Buyurtmachi: <strong className="text-slate-800 dark:text-slate-200">{order.clientName}</strong></span>
                      <span>•</span>
                      <span>{new Date(order.createdAt).toLocaleDateString('uz-UZ')}</span>
                    </div>
                  </div>

                  {/* Status Dropdown (Matches Image 6 purple/colored selector) */}
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Status:</span>
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order, e.target.value as OrderStatus)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border focus:outline-none cursor-pointer transition ${
                        order.status === 'completed'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40'
                          : order.status === 'in_progress'
                          ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/40'
                          : order.status === 'accepted'
                          ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/40'
                          : order.status === 'in_review'
                          ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/40'
                          : order.status === 'pending'
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40'
                          : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/40'
                      }`}
                    >
                      <option value="pending" className="bg-slate-900 text-white">Kutilmoqda (pending)</option>
                      <option value="in_review" className="bg-slate-900 text-white">Ko'rib chiqilmoqda (in_review)</option>
                      <option value="accepted" className="bg-slate-900 text-white">Qabul qilindi (accepted)</option>
                      <option value="in_progress" className="bg-slate-900 text-white">Jarayonda (in_progress)</option>
                      <option value="completed" className="bg-slate-900 text-white">Bajarildi (completed)</option>
                      <option value="cancelled" className="bg-slate-900 text-white">Bekor qilindi (cancelled)</option>
                    </select>
                  </div>
                </div>

                {/* Description Box (Matches Image 6 dark rounded container) */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {order.description}
                </div>

                {/* Assignment & Management Row: Kim qabul qildi & Qaysi a'zo ishlayapti */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs">
                  <div className="flex items-center space-x-2">
                    <UserCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Qabul Qilgan A'zo:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {order.acceptedByName || '(Hali belgilanmagan)'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <UserIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <div className="flex-grow">
                      <span className="text-[10px] text-slate-400 block font-semibold">Ustida Ishlayotgan Mutaxassis:</span>
                      <select
                        value={order.assignedMemberId || ''}
                        onChange={(e) => handleAssignMember(order, e.target.value)}
                        className="bg-transparent font-bold text-slate-800 dark:text-slate-200 border-b border-slate-300 dark:border-slate-700 focus:outline-none cursor-pointer w-full text-xs py-0.5"
                      >
                        <option value="" className="bg-slate-900 text-white">Biriktirish (Tanlang)...</option>
                        {allUsers.filter(u => u.role !== 'user').map(u => (
                          <option key={u.id} value={u.id} className="bg-slate-900 text-white">
                            {u.firstName || u.username} ({u.role})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Bottom Details Row: Budget, Deadline, User ID, Call & Telegram buttons (Matches Image 6) */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                  <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
                    {order.budget && (
                      <span>Taxminiy Byudjet: <strong className="text-slate-900 dark:text-white font-bold">{order.budget}</strong></span>
                    )}
                    {order.deadline && (
                      <span>Muddat: <strong className="text-slate-900 dark:text-white font-bold">{order.deadline}</strong></span>
                    )}
                    <span>User ID: <strong className="font-mono text-blue-600 dark:text-blue-400 font-bold">{order.userId}</strong></span>
                  </div>

                  {/* Contact Action Buttons (Matches Image 6 green phone & blue telegram buttons) */}
                  <div className="flex items-center space-x-2">
                    {order.clientPhone && (
                      <a
                        href={`tel:${cleanPhone}`}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 dark:text-emerald-400 hover:text-white border border-emerald-500/30 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-sm active:scale-95"
                        title="Telefon qilish"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{order.clientPhone}</span>
                      </a>
                    )}

                    {order.clientTelegram && (
                      <a
                        href={`https://t.me/${cleanTelegram}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-600 text-blue-600 dark:text-blue-400 hover:text-white border border-blue-500/30 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-sm active:scale-95"
                        title="Telegramda muloqot qilish"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>@{cleanTelegram}</span>
                        <ExternalLink className="w-3 h-3 ml-0.5" />
                      </a>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
