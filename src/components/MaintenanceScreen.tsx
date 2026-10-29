import React, { useState } from 'react';
import { Hammer, Sparkles, Send, MessageCircle, Lock, ShieldCheck } from 'lucide-react';
import { FoxLogo } from './FoxLogo';
import { StoreSettings, UserProfile } from '../types';
import { OWNER_EMAIL } from '../utils/storeLogic';

interface MaintenanceScreenProps {
  settings: StoreSettings;
  message?: string;
  user: UserProfile | null;
  onOpenOwnerAuth: () => void;
  onDisableMaintenance?: () => void;
}

export const MaintenanceScreen: React.FC<MaintenanceScreenProps> = ({
  settings,
  message,
  user,
  onOpenOwnerAuth,
  onDisableMaintenance
}) => {
  const isOwner = user?.role === 'owner' || user?.email.toLowerCase() === OWNER_EMAIL.toLowerCase();

  return (
    <div className="min-h-screen bg-[#08070d] text-slate-100 flex flex-col justify-between items-center p-6 relative overflow-hidden font-['Cairo',sans-serif]">
      {/* Background neon glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-fuchsia-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Brand Bar */}
      <header className="w-full max-w-4xl flex items-center justify-between py-4 border-b border-purple-500/20 z-10">
        <div className="flex items-center gap-3">
          <FoxLogo customLogoUrl={settings.logoUrl} size="md" />
          <div>
            <h1 className="text-xl font-black bg-gradient-to-r from-purple-400 via-fuchsia-300 to-purple-200 bg-clip-text text-transparent">
              {settings.storeNameEn || 'FOX CODES'}
            </h1>
            <span className="text-[10px] text-purple-400 font-bold uppercase tracking-widest block">
              VIP DIGITAL STORE
            </span>
          </div>
        </div>

        {/* Quick Contact Buttons */}
        <div className="flex items-center gap-2">
          <a
            href={settings.telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#229ED9]/15 hover:bg-[#229ED9]/25 text-[#229ED9] border border-[#229ED9]/30 text-xs font-bold transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Telegram</span>
          </a>
          <a
            href={settings.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] border border-[#25D366]/30 text-xs font-bold transition-all"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
        </div>
      </header>

      {/* Main Maintenance Card */}
      <main className="max-w-lg w-full text-center z-10 my-auto py-12">
        <div className="p-8 sm:p-10 rounded-3xl bg-[#0f0c1b]/90 border border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.25)] backdrop-blur-2xl space-y-6">
          {/* Animated Glowing Icon */}
          <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-purple-600/30 blur-xl animate-pulse" />
            <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-purple-900/80 to-[#120a22] border border-purple-400/60 flex items-center justify-center text-purple-300 shadow-[0_0_25px_rgba(168,85,247,0.4)]">
              <Hammer className="w-10 h-10 text-purple-300 animate-bounce" />
            </div>
          </div>

          {/* Heading & Exact Required Text */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-500/40 text-purple-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
              <span>System Upgrade & Maintenance</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white leading-tight font-sans">
              Maintenance in Progress
            </h2>

            {/* The exact required message */}
            <p className="text-base sm:text-lg font-medium text-purple-200/90 leading-relaxed max-w-md mx-auto font-sans">
              {message || "Sorry, we're currently performing maintenance. Please try again later."}
            </p>
          </div>

          {/* Support Info */}
          <div className="pt-4 border-t border-purple-500/20 text-xs text-slate-400 space-y-2">
            <p>For urgent inquiries or orders, reach out to our official channels:</p>
            <div className="flex items-center justify-center gap-3 font-semibold text-purple-300 text-xs">
              <span>{settings.telegramHandle}</span>
              <span>•</span>
              <span>{settings.whatsappNumber}</span>
            </div>
          </div>

          {/* Owner Quick Unlock / Management Gate */}
          {isOwner && onDisableMaintenance ? (
            <div className="pt-4 border-t border-purple-500/20">
              <button
                onClick={onDisableMaintenance}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg transition-all"
              >
                إيقاف وضع الصيانة والعودة للعمل فورًا (صلاحية المالك)
              </button>
            </div>
          ) : (
            <div className="pt-2">
              <button
                onClick={onOpenOwnerAuth}
                className="text-[11px] text-purple-400/60 hover:text-purple-300 flex items-center justify-center gap-1 mx-auto transition-colors"
              >
                <Lock className="w-3 h-3" />
                <span>Owner Portal Access</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-4xl py-4 border-t border-purple-500/10 text-center text-xs text-slate-500 z-10 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          FOX CODES VIP Security
        </span>
        <span>© {new Date().getFullYear()} FOX CODES</span>
      </footer>
    </div>
  );
};
