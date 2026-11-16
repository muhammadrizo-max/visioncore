import React, { useState } from 'react';
import { Play, Pause, ExternalLink, Sparkles } from 'lucide-react';
import { PortfolioItem } from '../types';

interface PortfolioShowcaseProps {
  portfolio: PortfolioItem[];
  marqueeEnabled?: boolean;
  onToggleMarquee?: () => void;
  darkMode?: boolean;
}

export const PortfolioShowcase: React.FC<PortfolioShowcaseProps> = ({
  portfolio,
  marqueeEnabled = true,
  onToggleMarquee,
  darkMode = true
}) => {
  const [localMarquee, setLocalMarquee] = useState(marqueeEnabled);

  const isMarqueeActive = onToggleMarquee ? marqueeEnabled : localMarquee;
  const toggleHandler = () => {
    if (onToggleMarquee) {
      onToggleMarquee();
    } else {
      setLocalMarquee(!localMarquee);
    }
  };

  const items = portfolio && portfolio.length > 0 ? portfolio : [];
  const row1Items = items.filter((_, idx) => idx % 2 === 0);
  const row2Items = items.filter((_, idx) => idx % 2 !== 0);

  const duplicatedRow1 = [...row1Items, ...row1Items, ...row1Items];
  const duplicatedRow2 = [...row2Items, ...row2Items, ...row2Items];

  const renderCard = (item: PortfolioItem, keySuffix: string | number) => (
    <div
      key={`${item.id}-${keySuffix}`}
      className="flex-shrink-0 w-[290px] sm:w-[320px] rounded-3xl liquid-glass overflow-hidden transition-all duration-300 group hover:border-blue-500/50 hover:scale-[1.01]"
    >
      <div className="relative h-40 sm:h-44 w-full overflow-hidden bg-slate-950">
        <img
          src={item.image}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
        <span className="absolute top-3 left-3 text-[10px] font-extrabold px-3 py-1 rounded-full bg-blue-600/90 text-white uppercase tracking-wider backdrop-blur-md shadow-md">
          {item.category}
        </span>
        {item.link && (
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-3 right-3 p-1.5 rounded-xl bg-slate-900/80 hover:bg-blue-600 text-white text-xs transition backdrop-blur-md"
            title="Loyihani ochish"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      <div className="p-4 sm:p-5 space-y-2.5">
        <h3 className={`text-sm font-bold line-clamp-1 transition group-hover:text-blue-500 ${
          darkMode ? 'text-white' : 'text-slate-900'
        }`}>
          {item.title}
        </h3>
        <p className={`text-xs line-clamp-2 leading-relaxed ${
          darkMode ? 'text-slate-400' : 'text-slate-600'
        }`}>
          {item.description}
        </p>
        
        <div className="flex flex-wrap gap-1.5 pt-1">
          {(item.tags || []).slice(0, 4).map((tag, i) => (
            <span
              key={i}
              className="text-[10px] font-mono px-2 py-0.5 rounded-md font-medium liquid-glass-subtle text-slate-700 dark:text-slate-300"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
            VisionCore Group jamoasi tomonidan yaratilgan haqiqiy va zamonaviy dasturiy loyihalar
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={toggleHandler}
            className={`px-4 py-2 rounded-2xl border text-xs font-bold transition flex items-center space-x-2 shadow-sm cursor-pointer ${
              isMarqueeActive
                ? 'bg-blue-600 text-white border-blue-500 shadow-blue-500/20'
                : 'liquid-glass-subtle text-slate-700 dark:text-slate-300'
            }`}
          >
            {isMarqueeActive ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Karusel harakati: Yoqilgan</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Karusel harakati: To'xtatilgan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {isMarqueeActive ? (
        <div className="space-y-4 overflow-hidden py-2 select-none">
          <div className="relative w-full overflow-hidden">
            <div className="animate-marquee-right flex gap-4">
              {duplicatedRow1.map((item, idx) => renderCard(item, `r1-${idx}`))}
            </div>
          </div>

          <div className="relative w-full overflow-hidden">
            <div className="animate-marquee-left flex gap-4">
              {duplicatedRow2.map((item, idx) => renderCard(item, `r2-${idx}`))}
            </div>
          </div>

          <div className="text-center pt-1">
            <span className={`text-[11px] font-medium tracking-wide ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
              (Kursorni loyiha ustiga olib borsangiz harakat to'xtaydi)
            </span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-2">
          {items.map((item, idx) => (
            <div key={item.id} className="w-full">
              {renderCard(item, `grid-${idx}`)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
