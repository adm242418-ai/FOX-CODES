import React, { useState } from 'react';
import {
  Wallet,
  X,
  CreditCard,
  Send,
  MessageCircle,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { Language, translations } from '../utils/i18n';
import { soundManager } from '../utils/sound';
import { StoreSettings, UserProfile } from '../types';

interface TopUpModalProps {
  user: UserProfile | null;
  settings: StoreSettings;
  lang: Language;
  onClose: () => void;
  onSubmit: (params: {
    amount: number;
    paymentMethod: string;
    transactionReference: string;
    receiptImageUrl?: string;
  }) => void;
  onOpenAuth: () => void;
}

export const TopUpModal: React.FC<TopUpModalProps> = ({
  user,
  settings,
  lang,
  onClose,
  onSubmit,
  onOpenAuth
}) => {
  const t = translations[lang];

  const [amount, setAmount] = useState<string>('20');
  const [paymentMethod, setPaymentMethod] = useState<string>('Vodafone Cash (فودافون كاش)');
  const [reference, setReference] = useState<string>('');
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);

  const paymentOptions = [
    { id: 'voda', nameAr: 'فودافون كاش (Vodafone Cash)', nameEn: 'Vodafone Cash', desc: 'تحويل كاش فوري' },
    { id: 'insta', nameAr: 'إنستاباي (InstaPay)', nameEn: 'InstaPay Egypt', desc: 'تحويل لحظي مصري' },
    { id: 'crypto', nameAr: 'عملات رقمية USDT (TRC20 / BEP20)', nameEn: 'Crypto USDT', desc: 'دفع عالمي مشفر' },
    { id: 'paypal', nameAr: 'بايبال (PayPal Friends & Family)', nameEn: 'PayPal', desc: 'دفع دولي' },
    { id: 'bank', nameAr: 'تحويل بنكي مباشر', nameEn: 'Bank Wire', desc: 'حسابات بنكية معتمدة' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth();
      return;
    }

    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0 || !reference.trim()) {
      soundManager.playError();
      return;
    }

    soundManager.playSuccess();
    onSubmit({
      amount: num,
      paymentMethod,
      transactionReference: reference.trim(),
      receiptImageUrl: receiptUrl.trim() || undefined
    });

    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#120e24] border border-purple-500/40 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-purple-600/20 border border-purple-500/30 text-purple-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">{t.requestTopUp}</h3>
              <span className="text-xs text-purple-300">
                {t.balance}: <strong className="text-emerald-400">${user?.balance.toFixed(2) || '0.00'}</strong>
              </span>
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

        {/* Notice about store wallet */}
        <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex items-start gap-2.5 text-xs text-slate-300">
          <HelpCircle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">{t.internalWalletNotice}</p>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-white">{t.topUpSubmitted}</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {lang === 'ar'
                ? 'يمكنك أيضًا إرسال إشعار للمالك عبر واتساب أو تيليجرام لسرعة تفعيل الرصيد.'
                : 'You may also ping the owner via WhatsApp or Telegram for immediate clearance.'}
            </p>

            <div className="flex justify-center gap-2 pt-2">
              <a
                href={settings.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/30 text-xs font-bold"
              >
                <MessageCircle className="w-4 h-4" />
                <span>إشعار عبر واتساب</span>
              </a>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold"
              >
                {t.close}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Amount */}
            <div>
              <label className="text-xs font-bold text-purple-300 block mb-1.5">{t.amountInUSD}</label>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {['10', '25', '50', '100'].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      soundManager.playClick();
                      setAmount(amt);
                    }}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      amount === amt
                        ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                        : 'bg-purple-950/20 text-slate-300 border-purple-500/20 hover:border-purple-400/40'
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>
              <input
                type="number"
                step="1"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#19142e] border border-purple-500/30 text-white text-sm font-bold focus:outline-none focus:border-purple-400"
                placeholder="أو أدخل مبلغًا مخصصًا..."
              />
            </div>

            {/* Payment Method */}
            <div>
              <label className="text-xs font-bold text-purple-300 block mb-1.5">{t.paymentMethod}</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#19142e] border border-purple-500/30 text-xs text-white focus:outline-none focus:border-purple-400"
              >
                {paymentOptions.map((opt) => (
                  <option key={opt.id} value={opt.nameAr}>
                    {lang === 'ar' ? opt.nameAr : opt.nameEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Transaction Reference / Sender Phone */}
            <div>
              <label className="text-xs font-bold text-purple-300 block mb-1.5">
                {t.transactionRef} (رقم الهاتف المحوّل منه أو رقم المعاملة)
              </label>
              <input
                type="text"
                required
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="مثال: تحويل من محفظة 010XXXXXXXX أو كود العملية..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#19142e] border border-purple-500/30 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
              />
            </div>

            {/* Direct Contact Links for Instant Payment Instructions */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-950/30 to-[#1b1432] border border-purple-500/20 text-xs space-y-2">
              <span className="text-[11px] font-bold text-purple-300 block">للحصول على بيانات التحويل الحالية:</span>
              <div className="flex items-center gap-2">
                <a
                  href={settings.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-[#25D366]/20 text-[#25D366] font-bold hover:bg-[#25D366]/30 transition-all text-center"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>واتساب: {settings.whatsappNumber}</span>
                </a>
                <a
                  href={settings.telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-[#229ED9]/20 text-[#229ED9] font-bold hover:bg-[#229ED9]/30 transition-all text-center"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>تيليجرام: {settings.telegramHandle}</span>
                </a>
              </div>
            </div>

            {/* Submit */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-purple-500/20">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white text-xs font-bold shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all active:scale-95"
              >
                {t.submitTopUp}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
