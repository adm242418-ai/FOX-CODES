import React, { useState } from 'react';
import {
  Wallet,
  Globe,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Send,
  MessageCircle,
  User as UserIcon,
  LogOut,
  PlusCircle,
  Menu,
  X
} from 'lucide-react';
import { FoxLogo } from './FoxLogo';
import { StoreSettings, UserProfile } from '../types';
import { translations, Language } from '../utils/i18n';
import { soundManager } from '../utils/sound';

interface HeaderProps {
  settings: StoreSettings;
  user: UserProfile | null;
  lang: Language;
  isDark: boolean;
  onLanguageChange: (lang: Language) => void;
  onThemeToggle: () => void;
  onOpenTopUp: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenOrders: () => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  user,
  lang,
  isDark,
  onLanguageChange,
  onThemeToggle,
  onOpenTopUp,
  onOpenAuth,
  onLogout,
  onOpenOrders,
  mobileMenuOpen,
  setMobileMenuOpen
}) => {
  const t = translations[lang];
  const [soundEnabled, setSoundEnabled] = useState(settings.soundEffectsEnabled);
  const [showSoundSlider, setShowSoundSlider] = useState(false);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundManager.setEnabled(next);
    if (next) soundManager.playClick();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    soundManager.setVolume(vol);
  };

  const handleTelegramClick = () => {
    soundManager.playClick();
    window.open(settings.telegramUrl, '_blank', 'noopener,noreferrer');
  };

  const handleWhatsAppClick = () => {
    soundManager.playClick();
    window.open(settings.whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-purple-500/20 backdrop-blur-xl bg-[#08070d]/90 shadow-[0_4px_25px_rgba(0,0,0,0.5)]">
      {/* Optional Announcement Ticker */}
      {settings.showAnnouncement && (
        <div className="bg-gradient-to-r from-purple-950/80 via-purple-700/30 to-purple-950/80 border-b border-purple-500/20 px-4 py-1.5 text-center text-xs md:text-sm font-medium text-purple-200">
          <div className="flex items-center justify-center gap-2">
            <span>{lang === 'ar' ? settings.announcementAr : settings.announcementEn}</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Logo & Store Brand */}
          <div className="flex items-center gap-3.5">
            {/* Mobile menu button */}
            <button
              onClick={() => {
                soundManager.playClick();
                setMobileMenuOpen(!mobileMenuOpen);
              }}
              className="md:hidden p-2 rounded-xl bg-purple-950/40 text-purple-300 hover:text-white border border-purple-500/30"
              aria-label="القائمة الجانبية"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <FoxLogo customLogoUrl={settings.logoUrl} size="md" />

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black tracking-wider bg-gradient-to-r from-purple-400 via-fuchsia-300 to-purple-200 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(168,85,247,0.5)] font-['Cairo',sans-serif]">
                  {lang === 'ar' ? settings.storeNameAr : settings.storeNameEn}
                </span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  VIP STORE
                </span>
              </div>
              <p className="text-xs text-slate-400 line-clamp-1 max-w-[200px] sm:max-w-md hidden xs:block">
                {lang === 'ar' ? settings.taglineAr : settings.taglineEn}
              </p>
            </div>
          </div>

          {/* Center / Quick Support Channels */}
          <div className="hidden lg:flex items-center gap-2">
            <button
              onClick={handleTelegramClick}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#229ED9]/15 hover:bg-[#229ED9]/25 text-[#229ED9] border border-[#229ED9]/30 text-xs font-semibold transition-all shadow-[0_0_12px_rgba(34,158,217,0.15)] hover:shadow-[0_0_20px_rgba(34,158,217,0.3)] active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{settings.telegramHandle}</span>
            </button>
            <button
              onClick={handleWhatsAppClick}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] border border-[#25D366]/30 text-xs font-semibold transition-all shadow-[0_0_12px_rgba(37,211,102,0.15)] hover:shadow-[0_0_20px_rgba(37,211,102,0.3)] active:scale-95"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{settings.whatsappNumber}</span>
            </button>
          </div>

          {/* Right Controls: Balance, Language, Theme, Sound, Auth */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Wallet Balance Badge */}
            {user ? (
              <div className="flex items-center gap-2 p-1 pl-2.5 rounded-2xl bg-gradient-to-r from-purple-950/60 to-purple-900/40 border border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-purple-200">
                  <Wallet className="w-4 h-4 text-purple-400" />
                  <span className="text-emerald-400">${user.balance.toFixed(2)}</span>
                </div>
                <button
                  onClick={() => {
                    soundManager.playClick();
                    onOpenTopUp();
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-[0_0_10px_rgba(168,85,247,0.5)] active:scale-95"
                  title={t.topUpBalance}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t.topUpBalance}</span>
                </button>
              </div>
            ) : null}

            {/* Sound Toggle */}
            <div className="relative hidden sm:block">
              <button
                onClick={toggleSound}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setShowSoundSlider(!showSoundSlider);
                }}
                className={`p-2 rounded-xl border text-xs transition-all ${
                  soundEnabled
                    ? 'bg-purple-950/40 border-purple-500/40 text-purple-300 hover:text-white shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                    : 'bg-slate-900/50 border-slate-700/50 text-slate-500'
                }`}
                title={t.sound}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {showSoundSlider && (
                <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-[#120e20] border border-purple-500/40 rounded-xl p-3 shadow-2xl z-50 w-36">
                  <span className="text-[10px] text-purple-300 block mb-1 font-semibold">{t.soundVolume}</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    defaultValue="0.4"
                    onChange={handleVolumeChange}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* Dark / Light Toggle */}
            <button
              onClick={() => {
                soundManager.playClick();
                onThemeToggle();
              }}
              className="p-2 rounded-xl bg-purple-950/30 hover:bg-purple-900/40 border border-purple-500/30 text-purple-300 hover:text-white transition-all shadow-[0_0_10px_rgba(168,85,247,0.15)]"
              title={isDark ? t.lightMode : t.darkMode}
              aria-label="تبديل المظهر"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-purple-300" />}
            </button>

            {/* Language Switch */}
            <button
              onClick={() => {
                soundManager.playClick();
                onLanguageChange(lang === 'ar' ? 'en' : 'ar');
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-purple-950/30 hover:bg-purple-900/40 border border-purple-500/30 text-purple-300 hover:text-white text-xs font-bold transition-all shadow-[0_0_10px_rgba(168,85,247,0.15)]"
              title={t.language}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'EN' : 'عربي'}</span>
            </button>

            {/* Auth / Account Profile */}
            {user ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    soundManager.playClick();
                    onOpenOrders();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/40 text-purple-200 text-xs font-semibold transition-all hover:border-purple-400"
                >
                  <UserIcon className="w-3.5 h-3.5 text-purple-400" />
                  <span className="hidden md:inline max-w-[100px] truncate">{user.displayName}</span>
                </button>
                <button
                  onClick={() => {
                    soundManager.playClick();
                    onLogout();
                  }}
                  className="p-2 rounded-xl bg-rose-950/30 hover:bg-rose-900/40 border border-rose-500/30 text-rose-400 hover:text-rose-200 transition-all"
                  title={t.logout}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  soundManager.playClick();
                  onOpenAuth();
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)] active:scale-95"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>{t.login}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
