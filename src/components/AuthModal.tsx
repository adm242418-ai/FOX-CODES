import React, { useState } from 'react';
import { User, Lock, Mail, X, Crown, ShieldCheck, ArrowRight } from 'lucide-react';
import { Language, translations } from '../utils/i18n';
import { soundManager } from '../utils/sound';
import { OWNER_EMAIL } from '../utils/storeLogic';
import { UserProfile } from '../types';

interface AuthModalProps {
  lang: Language;
  onClose: () => void;
  onLogin: (email: string, displayName?: string) => UserProfile;
}

export const AuthModal: React.FC<AuthModalProps> = ({ lang, onClose, onLogin }) => {
  const t = translations[lang];
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !email.includes('@')) {
      setErrorMsg(lang === 'ar' ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email address');
      soundManager.playError();
      return;
    }

    if (!password || password.length < 6) {
      setErrorMsg(lang === 'ar' ? 'كلمة المرور يجب أن لا تقل عن 6 أحرف' : 'Password must be at least 6 characters');
      soundManager.playError();
      return;
    }

    soundManager.playSuccess();
    onLogin(email.trim(), displayName.trim() || undefined);
    onClose();
  };

  const handleOwnerPrefill = () => {
    soundManager.playClick();
    setEmail(OWNER_EMAIL);
    setPassword('OwnerPass123!');
    setDisplayName('Fox Codes Owner');
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#120d24] border border-purple-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl relative space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-purple-600/20 border border-purple-500/30 text-purple-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">{isRegister ? t.register : t.login}</h3>
              <p className="text-xs text-purple-300">FOX CODES VIP ACCESS</p>
            </div>
          </div>
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="p-1.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Owner Access Helper */}
        <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-950/30 via-purple-950/40 to-amber-950/30 border border-amber-500/30 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-[11px] text-amber-200 font-bold">
              {lang === 'ar' ? 'حساب المالك المعتمد' : 'Verified Owner Account'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleOwnerPrefill}
            className="px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-[11px] font-bold transition-all"
          >
            تعبئة بيانات المالك
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isRegister && (
            <div>
              <label className="text-xs font-bold text-purple-300 block mb-1">الاسم أو اللقب</label>
              <div className="relative">
                <User className="w-4 h-4 text-purple-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="اسم المستخدم..."
                  className="w-full ps-10 pe-3.5 py-2.5 rounded-xl bg-[#191330] border border-purple-500/30 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-purple-300 block mb-1">{t.enterEmail}</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-purple-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full ps-10 pe-3.5 py-2.5 rounded-xl bg-[#191330] border border-purple-500/30 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-purple-300 block mb-1">{t.enterPassword}</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-purple-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full ps-10 pe-3.5 py-2.5 rounded-xl bg-[#191330] border border-purple-500/30 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-bold text-sm shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all active:scale-95"
          >
            {isRegister ? t.register : t.login}
          </button>
        </form>

        <div className="pt-3 border-t border-purple-500/20 text-center">
          <button
            type="button"
            onClick={() => {
              soundManager.playClick();
              setIsRegister(!isRegister);
              setErrorMsg('');
            }}
            className="text-xs text-purple-300 hover:text-white transition-colors"
          >
            {isRegister ? 'لديك حساب بالفعل؟ تسجيل الدخول' : 'ليس لديك حساب؟ إنشاء حساب جديد'}
          </button>
        </div>
      </div>
    </div>
  );
};
