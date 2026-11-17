import React, { useState } from 'react';
import { ExternalLink, Sparkles, X, Globe, Bot, Eye, Layers, ArrowRight } from 'lucide-react';
import { PortfolioItem } from '../types';

interface PortfolioShowcaseProps {
  portfolio: PortfolioItem[];
  darkMode?: boolean;
  onOrderSimilar?: (item: PortfolioItem) => void;
}

export const PortfolioShowcase: React.FC<PortfolioShowcaseProps> = ({
  portfolio,
  darkMode = true,
  onOrderSimilar
}) => {
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);

  const items = portfolio && portfolio.length > 0 ? portfolio : [];
  // Only split into 2 opposite-moving marquee rows when strictly more than 5 items
  const isDualRowMarquee = items.length > 5;

  const row1Items = items.filter((_, idx) => idx % 2 === 0);
  const row2Items = items.filter((_, idx) => idx % 2 !== 0);

  const duplicatedRow1 = [...row1Items, ...row1Items, ...row1Items];
  const duplicatedRow2 = [...row2Items, ...row2Items, ...row2Items];

  const isBotItem = (item: PortfolioItem) => {
    const cat = (item.category || '').toLowerCase();
    const lnk = (item.link || '').toLowerCase();
    return cat.includes('bot') || lnk.includes('t.me') || lnk.includes('telegram.me');
  };

  const renderCard = (item: PortfolioItem, keySuffix: string | number, compactGrid = false) => (
    <div
      key={`${item.id}-${keySuffix}`}
      onClick={() => setSelectedItem(item)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setSelectedItem(item);
        }
      }}
      className={`${
        compactGrid ? 'w-full' : 'flex-shrink-0 w-[225px] sm:w-[248px]'
      } rounded-2xl liquid-glass overflow-hidden transition-all duration-300 group hover:border-blue-500/50 hover:scale-[1.015] cursor-pointer text-left`}
    >
      <div className="relative h-28 sm:h-32 w-full overflow-hidden bg-slate-950">
        <img
          src={item.image}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />

        <span className="absolute top-2.5 left-2.5 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-600/90 text-white uppercase tracking-wider backdrop-blur-md shadow">
          {item.category}
        </span>

        <div className="absolute top-2.5 right-2.5 flex items-center space-x-1">
          <span className="px-2 py-0.5 rounded-lg bg-black/60 text-white text-[10px] font-bold backdrop-blur-md opacity-0 group-hover:opacity-100 transition flex items-center space-x-1">
            <Eye className="w-3 h-3" />
            <span>Ko'rish</span>
          </span>
          {item.link && (
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-blue-600 text-white text-xs transition backdrop-blur-md"
              title="Havolani ochish"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      <div className="p-3.5 space-y-1.5">
        <h3 className={`text-xs sm:text-sm font-bold line-clamp-1 transition group-hover:text-blue-500 ${
          darkMode ? 'text-white' : 'text-slate-900'
        }`}>
          {item.title}
        </h3>
        <p className={`text-[11px] line-clamp-2 leading-relaxed ${
          darkMode ? 'text-slate-400' : 'text-slate-600'
        }`}>
          {item.description}
        </p>

        <div className="flex flex-wrap gap-1 pt-1">
          {(item.tags || []).slice(0, 3).map((tag, i) => (
            <span
              key={i}
              className="text-[9px] font-mono px-1.5 py-0.5 rounded font-medium liquid-glass-subtle text-slate-700 dark:text-slate-300"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>PORTFOLIO & TAYYOR LOYIHALAR</span>
          </div>
          <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${
            darkMode ? 'text-white' : 'text-slate-900'
          }`}>
            Bizning Qilgan Ishlarimiz
          </h2>
          <p className={`text-xs sm:text-sm ${
            darkMode ? 'text-slate-400' : 'text-slate-600'
          }`}>
            Loyihalar ustiga bosib batafsil ko'rishingiz, sayt yoki bot ko'rinishini ochishingiz mumkin
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="p-8 rounded-3xl liquid-glass text-center text-xs text-slate-500 dark:text-slate-400">
          Hozircha portfolio loyihalari qo'shilmagan.
        </div>
      ) : isDualRowMarquee ? (
        <div className="space-y-3.5 overflow-hidden py-1 select-none">
          <div className="relative w-full overflow-hidden">
            <div className="animate-marquee-right flex gap-3.5">
              {duplicatedRow1.map((item, idx) => renderCard(item, `r1-${idx}`))}
            </div>
          </div>

          <div className="relative w-full overflow-hidden">
            <div className="animate-marquee-left flex gap-3.5">
              {duplicatedRow2.map((item, idx) => renderCard(item, `r2-${idx}`))}
            </div>
          </div>

          <div className="text-center pt-0.5">
            <span className="text-[11px] font-medium tracking-wide text-slate-500">
              (Loyihani ko'rish uchun ustiga bosing — kursor ustida harakat to'xtaydi)
            </span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 pt-1">
          {items.map((item, idx) => renderCard(item, `grid-${idx}`, true))}
        </div>
      )}

      {/* Interactive Portfolio Preview Modal (Website / Telegram Bot / Showcase) */}
      {selectedItem && (
        <div
          onClick={() => setSelectedItem(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl rounded-3xl liquid-glass border border-slate-200/60 dark:border-white/15 overflow-hidden shadow-2xl"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/40 dark:border-white/10">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-500 flex items-center justify-center flex-shrink-0">
                  {isBotItem(selectedItem) ? <Bot className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-500 block">
                    {selectedItem.category}
                  </span>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                    {selectedItem.title}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="p-2 rounded-xl liquid-glass-subtle text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Interactive Content */}
            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* If website URL is configured (not t.me), render live interactive iframe preview */}
              {selectedItem.link && !isBotItem(selectedItem) ? (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl liquid-glass-subtle text-xs">
                    <span className="font-mono text-slate-600 dark:text-slate-300 truncate max-w-[75%]">
                      {selectedItem.link}
                    </span>
                    <a
                      href={selectedItem.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center space-x-1 flex-shrink-0"
                    >
                      <span>Yangi oynada ochish</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  <div className="w-full h-72 sm:h-80 rounded-2xl overflow-hidden border border-slate-300/40 dark:border-white/10 bg-slate-950">
                    <iframe
                      src={selectedItem.link}
                      title={selectedItem.title}
                      className="w-full h-full border-0 bg-white"
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    />
                  </div>
                </div>
              ) : (
                <div className="relative h-56 sm:h-64 rounded-2xl overflow-hidden border border-slate-300/40 dark:border-white/10 bg-slate-950">
                  <img
                    src={selectedItem.image}
                    alt={selectedItem.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/25 to-transparent flex items-end p-5">
                    <div className="flex items-center justify-between w-full gap-3">
                      <div className="text-white">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-300 flex items-center space-x-1.5 mb-1">
                          {isBotItem(selectedItem) ? <Bot className="w-3.5 h-3.5" /> : <Layers className="w-3.5 h-3.5" />}
                          <span>{isBotItem(selectedItem) ? 'Telegram Bot Loyihasi' : 'Dasturiy Yechim Taqdimoti'}</span>
                        </span>
                        <h4 className="text-base sm:text-lg font-black">{selectedItem.title}</h4>
                      </div>
                      {selectedItem.link && (
                        <a
                          href={selectedItem.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-lg flex-shrink-0"
                        >
                          <span>{isBotItem(selectedItem) ? 'Telegramda ochish' : 'Loyihani ko\'rish'}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Project Description & Tech Tags */}
              <div className="p-4 rounded-2xl liquid-glass-subtle space-y-3">
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                  {selectedItem.description}
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {(selectedItem.tags || []).map((tag, i) => (
                    <span
                      key={i}
                      className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/20 font-semibold"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                {selectedItem.link ? (
                  <a
                    href={selectedItem.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md flex items-center space-x-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>{isBotItem(selectedItem) ? 'Botga o\'tish' : 'Saytga o\'tish'}</span>
                  </a>
                ) : (
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Batafsil demo havola sozlamalardan biriktirilishi mumkin
                  </span>
                )}

                <div className="flex items-center space-x-2 ml-auto">
                  {onOrderSimilar && (
                    <button
                      type="button"
                      onClick={() => {
                        const item = selectedItem;
                        setSelectedItem(null);
                        onOrderSimilar(item);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      <span>Shunday loyiha buyurtma qilish</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedItem(null)}
                    className="px-4 py-2.5 rounded-xl liquid-glass-subtle text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    Yopish
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
