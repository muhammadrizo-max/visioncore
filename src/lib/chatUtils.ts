import { ChatMessage } from '../types';

export function getCanonicalDmChatId(idA: string, idB: string): string {
  return `direct::${[idA, idB].sort().join('::')}`;
}

export function extractDmParticipants(chatId: string): [string, string] | null {
  if (!chatId) return null;
  if (chatId.startsWith('direct::')) {
    const parts = chatId.slice(8).split('::').filter(Boolean);
    if (parts.length === 2) return [parts[0], parts[1]];
  }
  if (chatId.startsWith('direct_')) {
    const body = chatId.slice(7);
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

export function getChatMessageTimestampMs(msg: ChatMessage): number {
  if (msg.createdAt) {
    const parsed = Date.parse(msg.createdAt);
    if (!Number.isNaN(parsed) && parsed > 0) return parsed;
  }
  const idEpoch = msg.id.match(/(\d{13})/);
  if (idEpoch) {
    const num = Number(idEpoch[1]);
    if (!Number.isNaN(num) && num > 0) return num;
  }
  return 0;
}

export function sortChatMessages(list: ChatMessage[]): ChatMessage[] {
  return [...list].sort((a, b) => {
    const tsA = getChatMessageTimestampMs(a);
    const tsB = getChatMessageTimestampMs(b);
    if (tsA !== tsB) return tsA - tsB;

    const idNumA = Number(a.id.match(/(\d{13})/)?.[1] || 0);
    const idNumB = Number(b.id.match(/(\d{13})/)?.[1] || 0);
    if (idNumA !== idNumB) return idNumA - idNumB;

    return a.id.localeCompare(b.id);
  });
}

export function mergeChatLists(
  current: ChatMessage[],
  incoming: ChatMessage[],
  pendingIds?: Set<string>
): ChatMessage[] {
  const byId = new Map<string, ChatMessage>();

  // Start with incoming authoritative server list
  for (const m of incoming) {
    byId.set(m.id, m);
  }

  // Preserve optimistic messages that are currently in-flight or just sent so polls never drop or jump them
  const now = Date.now();
  for (const m of current) {
    if (!byId.has(m.id)) {
      const ts = getChatMessageTimestampMs(m);
      const isRecentlyPending = pendingIds?.has(m.id) || (ts > 0 && now - ts < 15000);
      if (isRecentlyPending) {
        byId.set(m.id, m);
      }
    }
  }

  return sortChatMessages(Array.from(byId.values()));
}

export function formatChatDayLabel(isoOrDate?: string): string {
  const d = isoOrDate ? new Date(isoOrDate) : new Date();
  if (Number.isNaN(d.getTime())) return 'Bugun';

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const targetStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((todayStart - targetStart) / 86400000);

  if (diffDays === 0) return 'Bugun';
  if (diffDays === 1) return 'Kecha';
  return d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function getChatDayKey(msg: ChatMessage): string {
  const ms = getChatMessageTimestampMs(msg);
  const d = ms ? new Date(ms) : new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const REPLY_PREFIX = '::REPLY::';

export interface ParsedReplyMessage {
  replyAuthor?: string;
  replySnippet?: string;
  body: string;
}

export function encodeReplyText(replyAuthor: string, replySnippet: string, body: string): string {
  const cleanAuthor = replyAuthor.replace(/[\r\n|]/g, ' ').trim().slice(0, 60);
  const cleanSnippet = replySnippet.replace(/[\r\n|]/g, ' ').trim().slice(0, 120);
  return `${REPLY_PREFIX}${cleanAuthor}|${cleanSnippet}\n${body}`;
}

export function parseReplyText(rawText: string): ParsedReplyMessage {
  if (!rawText || !rawText.startsWith(REPLY_PREFIX)) {
    return { body: rawText || '' };
  }
  const newlineIdx = rawText.indexOf('\n');
  if (newlineIdx === -1) return { body: rawText };
  const header = rawText.slice(REPLY_PREFIX.length, newlineIdx);
  const pipeIdx = header.indexOf('|');
  if (pipeIdx === -1) return { body: rawText };
  return {
    replyAuthor: header.slice(0, pipeIdx),
    replySnippet: header.slice(pipeIdx + 1),
    body: rawText.slice(newlineIdx + 1),
  };
}
