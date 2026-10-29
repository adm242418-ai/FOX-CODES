import React from 'react';
import { Crown, Store, User, ShieldCheck, Send, MessageCircle, Sparkles } from 'lucide-react';
import { translations, Language } from '../utils/i18n';
import { soundManager } from '../utils/sound';
import { StoreSettings, UserProfile } from '../types';

export type ActiveSection = 'owner' | 'distributor' | 'customer';

interface SidebarProps {
  activeSection: ActiveSection;
  onSelectSection: (section: ActiveSection) => void;
  lang: Language;
  settings: StoreSettings;
  user: UserProfile | null;
  mobileMenuOpen: boolean;
  onCloseMobileMenu: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSelectSection,
  lang,
  settings,
  user,
  mobileMenuOpen,
  onCloseMobileMenu
}) => {
  const t = translations[lang];

  const handleSelect = (section: ActiveSection) => {
    soundManager.playClick();
    onSelectSection(section);
    onCloseMobileMenu();
  };

  const navItems: Array<{
    id: ActiveSection;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    badge?: string;
  }> = [
    {
      id: 'owner',
      title: t.navOwner,
      subtitle: t.ownerNotice,
      icon: <Crown className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform" />,
      badge: user?.role === 'owner' ? (lang === 'ar' ? 'معتمد' : 'Verified') : (lang === 'ar' ? 'مقفل 🔒' : 'Locked 🔒')
    },
    {
      id: 'distributor',
      title: t.navDistributor,
      subtitle: t.distributorNotice,
      icon: <Store className="w-6 h-6 text-fuchsia-400 group-hover:scale-110 transition-transform" />,
      badge: user?.role === 'distributor' ? (lang === 'ar' ? 'موزع نشط' : 'Active') : (lang === 'ar' ? 'جملة' : 'Wholesale')
    },
    {
      id: 'customer',
      title: t.navCustomer,
      subtitle: t.customerNotice,
      icon: <User className="w-6 h-6 text-purple-400 group-hover:scale-110 transition-transform" />
    }
  ];

  return (
    <>
      {/* Mobile & Tablet Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobileMenu}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed lg:sticky top-24 z-40 h-[calc(100vh-7rem)] w-[280px] lg:w-[22%] shrink-0 p-4 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        } ${lang === 'ar' ? 'right-0 lg:right-auto lg:left-0' : 'left-0'} bg-[#0c0917]/95 border border-purple-500/25 rounded-3xl backdrop-blur-2xl flex flex-col justify-between overflow-y-auto shadow-2xl`}
      >
        <div className="space-y-4">
          <div className="px-2 pt-2 pb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400/80 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              {lang === 'ar' ? 'أقسام المتجر' : 'Store Sections'}
            </span>
          </div>

          {/* 3 Main Action Cards */}
          <div className="space-y-3">
            {navItems.map((item) => {
              const isSelected = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`w-full group text-start p-4 rounded-2xl transition-all duration-300 relative overflow-hidden border ${
                    isSelected
                      ? 'bg-gradient-to-br from-purple-900/60 via-purple-950/40 to-[#120b22] border-purple-400/80 shadow-[0_0_25px_rgba(168,85,247,0.35)] scale-[1.02]'
                      : 'bg-[#120d22]/50 hover:bg-purple-950/30 border-purple-500/20 hover:border-purple-400/40'
                  }`}
                >
                  {/* Neon Glow bar on active */}
                  {isSelected && (
                    <div className="absolute top-0 bottom-0 start-0 w-1.5 bg-gradient-to-b from-purple-400 via-fuchsia-400 to-purple-600 shadow-[0_0_12px_#c084fc]" />
                  )}

                  <div className="flex items-start gap-3.5">
                    <div
                      className={`p-2.5 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-purple-500/20 border-purple-400/60 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                          : 'bg-purple-950/30 border-purple-500/20 text-purple-400'
                      }`}
                    >
                      {item.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <h3 className="font-black text-base text-slate-100 group-hover:text-purple-200 transition-colors">
                          {item.title}
                        </h3>
                        {item.badge && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              item.badge.includes('🔒')
                                ? 'bg-amber-950/40 text-amber-300 border-amber-500/30'
                                : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar Footer: Security info & Direct VIP contact */}
        <div className="pt-4 border-t border-purple-500/20 space-y-3">
          <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 flex items-center gap-2.5 text-xs text-slate-400">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="leading-tight">{t.securityVerified}</span>
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 block px-1">
              {t.contactOwner}
            </span>
            <div className="grid grid-cols-2 gap-2">
              <a
                href={settings.telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => soundManager.playClick()}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-[#229ED9]/15 hover:bg-[#229ED9]/25 text-[#229ED9] border border-[#229ED9]/30 text-xs font-bold transition-all text-center"
              >
                <Send className="w-3.5 h-3.5" />
                <span>تيليجرام</span>
              </a>
              <a
                href={settings.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => soundManager.playClick()}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] border border-[#25D366]/30 text-xs font-bold transition-all text-center"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>واتساب</span>
              </a>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
