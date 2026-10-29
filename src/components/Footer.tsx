import React from 'react';
import { Send, MessageCircle, ShieldCheck, Heart, Sparkles } from 'lucide-react';
import { FoxLogo } from './FoxLogo';
import { StoreSettings } from '../types';
import { Language, translations } from '../utils/i18n';
import { soundManager } from '../utils/sound';

interface FooterProps {
  settings: StoreSettings;
  lang: Language;
}

export const Footer: React.FC<FooterProps> = ({ settings, lang }) => {
  const t = translations[lang];

  return (
    <footer className="mt-16 border-t border-purple-500/20 bg-[#07050b]/95 text-slate-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-3.5 text-center md:text-start">
            <FoxLogo customLogoUrl={settings.logoUrl} size="md" />
            <div>
              <h3 className="text-xl font-black bg-gradient-to-r from-purple-400 via-fuchsia-300 to-purple-200 bg-clip-text text-transparent">
                {lang === 'ar' ? settings.storeNameAr : settings.storeNameEn}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {lang === 'ar' ? settings.taglineAr : settings.taglineEn}
              </p>
            </div>
          </div>

          {/* Direct channels */}
          <div className="flex items-center gap-3">
            <a
              href={settings.telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => soundManager.playClick()}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#229ED9]/15 hover:bg-[#229ED9]/25 text-[#229ED9] border border-[#229ED9]/30 text-xs font-bold transition-all shadow-[0_0_15px_rgba(34,158,217,0.15)]"
            >
              <Send className="w-4 h-4" />
              <span>{t.telegramButton} ({settings.telegramHandle})</span>
            </a>

            <a
              href={settings.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => soundManager.playClick()}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] border border-[#25D366]/30 text-xs font-bold transition-all shadow-[0_0_15px_rgba(37,211,102,0.15)]"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{t.whatsappButton} ({settings.whatsappNumber})</span>
            </a>
          </div>
        </div>

        {/* Security & Disclaimer */}
        <div className="pt-6 border-t border-purple-500/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>FOX CODES VIP — {lang === 'ar' ? 'نظام تسليم فوري مشفر ومحمي' : 'Instant & Encrypted Delivery'}</span>
          </div>

          <div className="text-center sm:text-end">
            <span>© {new Date().getFullYear()} FOX CODES. {lang === 'ar' ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
