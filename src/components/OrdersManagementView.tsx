import React, { useState } from 'react';
import {
  ShoppingBag,
  Search,
  Phone,
  Send,
  ExternalLink,
  UserCheck,
  User as UserIcon,
  UserPlus,
  Check,
  Crown,
} from 'lucide-react';
import { Order, OrderStatus, User } from '../types';

interface OrdersManagementViewProps {
  orders: Order[];
  allUsers: User[];
  currentUser: User;
  onUpdateOrder: (updatedOrder: Order) => void;
  darkMode: boolean;
}

export function getOrderAssignedIds(order: Order): string[] {
  if (Array.isArray(order.assignedMemberIds) && order.assignedMemberIds.length > 0) {
    return order.assignedMemberIds;
  }
  if (order.assignedMemberId) {
    return order.assignedMemberId
      .replace(/^CREATOR::/, '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

export function getOrderAssignedNames(order: Order, allUsers: User[]): string[] {
  const ids = getOrderAssignedIds(order);
  if (ids.length > 0) {
    return ids.map((id, idx) => {
      const u = allUsers.find((usr) => usr.id === id);
      if (u) return `${u.firstName || u.username} ${u.lastName || ''}`.trim();
      if (order.assignedMemberNames?.[idx]) return order.assignedMemberNames[idx];
      return id;
    });
  }
  if (Array.isArray(order.assignedMemberNames) && order.assignedMemberNames.length > 0) {
    return order.assignedMemberNames;
  }
  return order.assignedMemberName ? [order.assignedMemberName] : [];
}

export const OrdersManagementView: React.FC<OrdersManagementViewProps> = ({
  orders,
  allUsers,
  currentUser,
  onUpdateOrder,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [limitWarnId, setLimitWarnId] = useState<string | null>(null);

  const isCreator = currentUser.role === 'creator';
  const teamMembers = allUsers.filter((u) => u.role !== 'user');

  const assignedToMeCount = orders.filter((o) =>
    getOrderAssignedIds(o).includes(currentUser.id)
  ).length;

  const filteredOrders = orders.filter((o) => {
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'mine'
        ? getOrderAssignedIds(o).includes(currentUser.id)
        : o.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
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
      acceptedById: order.acceptedById || currentUser.id,
      acceptedByName:
        order.acceptedByName ||
        `${currentUser.firstName || currentUser.username} ${currentUser.lastName || ''}`.trim(),
    };
    onUpdateOrder(updated);
  };

  // Creator: toggle up to 3 specialists (overrides member self-claim)
  const handleToggleCreatorSpecialist = (order: Order, member: User) => {
    if (!isCreator) return;
    setLimitWarnId(null);
    const currentIds = getOrderAssignedIds(order);
    let nextIds: string[];

    if (currentIds.includes(member.id)) {
      nextIds = currentIds.filter((id) => id !== member.id);
    } else {
      if (currentIds.length >= 3) {
        setLimitWarnId(order.id);
        return;
      }
      nextIds = [...currentIds, member.id];
    }

    const nextNames = nextIds.map((id) => {
      const m = allUsers.find((u) => u.id === id);
      return m ? `${m.firstName || m.username} ${m.lastName || ''}`.trim() : id;
    });

    onUpdateOrder({
      ...order,
      assignedMemberId: nextIds[0] || undefined,
      assignedMemberName: nextNames[0] || undefined,
      assignedMemberIds: nextIds,
      assignedMemberNames: nextNames,
      assignedByCreator: nextIds.length > 0,
    });
  };

  // Non-creator member: claim order for self ("O'zimga olish")
  const handleClaimForSelf = (order: Order) => {
    if (isCreator || order.assignedByCreator) return;
    const currentIds = getOrderAssignedIds(order);
    if (currentIds.includes(currentUser.id) || currentIds.length > 0) return;

    const myName = `${currentUser.firstName || currentUser.username} ${currentUser.lastName || ''}`.trim();
    onUpdateOrder({
      ...order,
      assignedMemberId: currentUser.id,
      assignedMemberName: myName,
      assignedMemberIds: [currentUser.id],
      assignedMemberNames: [myName],
      assignedByCreator: false,
      acceptedById: order.acceptedById || currentUser.id,
      acceptedByName: order.acceptedByName || myName,
    });
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wider">
            <ShoppingBag className="w-4 h-4" />
            <span>Mijozlar Buyurtmalari Markazi</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Mijoz Buyurtmalari ({orders.length})
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Foydalanuvchilardan kelgan loyiha arizalari, statuslar, javobgar mutaxassislar va bevosita aloqa
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-bold">
            {orders.filter((o) => o.status === 'pending').length} yangi kutilmoqda
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-700 dark:text-purple-300 font-bold">
            {orders.filter((o) => o.status === 'in_progress').length} jarayonda
          </span>
        </div>
      </div>

      {/* Overall Orders Statistics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Jami buyurtmalar', value: orders.length, color: 'text-slate-900 dark:text-white' },
          { label: 'Kutilmoqda', value: orders.filter((o) => o.status === 'pending').length, color: 'text-amber-600 dark:text-amber-400' },
          { label: "Ko'rib chiqilmoqda", value: orders.filter((o) => o.status === 'in_review').length, color: 'text-indigo-600 dark:text-indigo-400' },
          { label: 'Qabul qilindi', value: orders.filter((o) => o.status === 'accepted').length, color: 'text-blue-600 dark:text-blue-400' },
          { label: 'Jarayonda', value: orders.filter((o) => o.status === 'in_progress').length, color: 'text-purple-600 dark:text-purple-400' },
          { label: 'Bajarildi', value: orders.filter((o) => o.status === 'completed').length, color: 'text-emerald-600 dark:text-emerald-400' },
        ].map((stat) => (
          <div key={stat.label} className="p-3.5 rounded-2xl liquid-glass space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block truncate">
              {stat.label}
            </span>
            <div className={`text-xl font-black ${stat.color}`}>{stat.value} ta</div>
          </div>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-3xl liquid-glass flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Loyiha nomi, mijoz yoki @username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl liquid-glass-subtle text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto pb-1">
          {[
            { id: 'all', label: 'Barchasi' },
            { id: 'mine', label: `Menga biriktirilgan (${assignedToMeCount})` },
            { id: 'pending', label: 'Kutilmoqda' },
            { id: 'in_review', label: "Ko'rib chiqilmoqda" },
            { id: 'accepted', label: 'Qabul qilindi' },
            { id: 'in_progress', label: 'Jarayonda' },
            { id: 'completed', label: 'Bajarildi' },
            { id: 'cancelled', label: 'Bekor' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setStatusFilter(item.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                statusFilter === item.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'liquid-glass-subtle text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="p-12 text-center rounded-3xl liquid-glass space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-500 mx-auto flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Buyurtmalar mavjud emas
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
            {statusFilter === 'mine'
              ? 'Sizga hozircha buyurtma biriktirilmagan.'
              : 'Hozircha mijozlar tomonidan yangi buyurtmalar qoldirilmagan.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredOrders.map((order) => {
            const cleanTelegram = order.clientTelegram.replace(/^@/, '');
            const cleanPhone = order.clientPhone.replace(/\s+/g, '');
            const assignedIds = getOrderAssignedIds(order);
            const assignedNames = getOrderAssignedNames(order, allUsers);
            const isAssignedToMe = assignedIds.includes(currentUser.id);
            const canSelfClaim = !isCreator && !order.assignedByCreator && assignedIds.length === 0;

            return (
              <div
                key={order.id}
                className={`p-5 sm:p-6 rounded-3xl liquid-glass transition space-y-4 ${
                  isAssignedToMe
                    ? 'border-blue-500/50 ring-1 ring-blue-500/20'
                    : 'hover:border-blue-500/35'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-300/50 dark:border-white/10 pb-3.5">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg bg-blue-600/15 border border-blue-500/30 text-blue-600 dark:text-blue-400 font-mono text-xs font-bold">
                        {order.id}
                      </span>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">
                        {order.projectName}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full liquid-glass-subtle text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">
                        {order.projectType.replace('_', ' ')}
                      </span>
                      {isAssignedToMe && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold uppercase">
                          Sizga biriktirilgan
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-400">
                      <span>
                        Buyurtmachi:{' '}
                        <strong className="text-slate-900 dark:text-slate-200">{order.clientName}</strong>
                      </span>
                      <span>•</span>
                      <span>{new Date(order.createdAt).toLocaleDateString('uz-UZ')}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Status:</span>
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
                      <option value="pending" className="bg-slate-900 text-white">Kutilmoqda</option>
                      <option value="in_review" className="bg-slate-900 text-white">Ko'rib chiqilmoqda</option>
                      <option value="accepted" className="bg-slate-900 text-white">Qabul qilindi</option>
                      <option value="in_progress" className="bg-slate-900 text-white">Jarayonda</option>
                      <option value="completed" className="bg-slate-900 text-white">Bajarildi</option>
                      <option value="cancelled" className="bg-slate-900 text-white">Bekor qilindi</option>
                    </select>
                  </div>
                </div>

                <div className="p-4 rounded-2xl liquid-glass-subtle text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {order.description}
                </div>

                {/* Specialist Assignment Panel */}
                <div className="p-4 rounded-2xl liquid-glass-subtle space-y-3 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <UserCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">
                          Qabul qilgan:
                        </span>
                        <span className="font-bold text-slate-900 dark:text-slate-200">
                          {order.acceptedByName || '(Hali belgilanmagan)'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <UserIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold flex items-center space-x-1">
                          <span>Biriktirilgan mutaxassis(lar):</span>
                          {order.assignedByCreator && (
                            <span className="inline-flex items-center space-x-0.5 text-amber-500 font-bold">
                              <Crown className="w-3 h-3" />
                              <span>Creator belgilagan</span>
                            </span>
                          )}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {assignedNames.length > 0
                            ? assignedNames.join(', ')
                            : '(Hali biriktirilmagan)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Creator: Multi-select up to 3 specialists */}
                  {isCreator ? (
                    <div className="pt-2 border-t border-slate-300/40 dark:border-white/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          Mutaxassis(lar)ni belgilash (1–3 tagacha):
                        </span>
                        <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400">
                          Tanlangan: {assignedIds.length} / 3
                        </span>
                      </div>

                      {limitWarnId === order.id && (
                        <p className="text-[11px] font-bold text-amber-500">
                          Ko'pi bilan 3 ta mutaxassis biriktirish mumkin! Boshqasini tanlash uchun avval birortasini olib tashlang.
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {teamMembers.map((member) => {
                          const isSelected = assignedIds.includes(member.id);
                          const memberLabel = `${member.firstName || member.username} ${member.lastName || ''}`.trim();
                          return (
                            <button
                              key={member.id}
                              type="button"
                              onClick={() => handleToggleCreatorSpecialist(order, member)}
                              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition flex items-center space-x-1.5 cursor-pointer ${
                                isSelected
                                  ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                                  : 'liquid-glass hover:border-blue-500/50 text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3" />}
                              <span>{memberLabel}</span>
                              <span
                                className={`text-[9px] uppercase px-1.5 py-0.2 rounded ${
                                  isSelected
                                    ? 'bg-white/20 text-white'
                                    : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                                }`}
                              >
                                {member.role}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    /* Team Members: View only + "O'zimga olish" if unassigned */
                    <div className="pt-2 border-t border-slate-300/40 dark:border-white/10 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {order.assignedByCreator
                          ? 'Creator tomonidan biriktirilgan (o\'zgartirish faqat Creator huquqida).'
                          : assignedIds.length > 0
                          ? `Ushbu buyurtma ${assignedNames.join(', ')} tomonidan olingan.`
                          : "Buyurtma hali hech kimga biriktirilmagan. O'zingizga olishingiz mumkin."}
                      </span>

                      {canSelfClaim && (
                        <button
                          type="button"
                          onClick={() => handleClaimForSelf(order)}
                          className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md active:scale-95 flex items-center space-x-1.5 cursor-pointer"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>O'zimga olish</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                  <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
                    {order.budget && (
                      <span>
                        Taxminiy Byudjet:{' '}
                        <strong className="text-slate-900 dark:text-white font-bold">{order.budget}</strong>
                      </span>
                    )}
                    {order.deadline && (
                      <span>
                        Muddat:{' '}
                        <strong className="text-slate-900 dark:text-white font-bold">{order.deadline}</strong>
                      </span>
                    )}
                    <span>
                      User ID:{' '}
                      <strong className="font-mono text-blue-600 dark:text-blue-400 font-bold">
                        {order.userId}
                      </strong>
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {order.clientPhone && (
                      <a
                        href={`tel:${cleanPhone}`}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500 text-emerald-700 dark:text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-sm active:scale-95"
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
                        className="px-3.5 py-1.5 rounded-xl bg-blue-500/15 hover:bg-blue-600 text-blue-700 dark:text-blue-300 hover:text-white border border-blue-500/30 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-sm active:scale-95"
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
