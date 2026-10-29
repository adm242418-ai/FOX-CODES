import React, { useState } from 'react';
import { CheckCircle2, Copy, CheckCheck, X, Key, ShieldCheck, ExternalLink } from 'lucide-react';
import { Order } from '../types';
import { Language, translations } from '../utils/i18n';
import { soundManager } from '../utils/sound';

interface PurchaseSuccessModalProps {
  order: Order;
  code: string;
  lang: Language;
  onClose: () => void;
  onViewOrders: () => void;
}

export const PurchaseSuccessModal: React.FC<PurchaseSuccessModalProps> = ({
  order,
  code,
  lang,
  onClose,
  onViewOrders
}) => {
  const t = translations[lang];
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    soundManager.playSuccess();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#120e24] border border-purple-500/50 rounded-3xl p-6 max-w-lg w-full shadow-[0_0_50px_rgba(168,85,247,0.3)] space-y-5 relative">
        {/* Close Button */}
        <button
          onClick={() => {
            soundManager.playClick();
            onClose();
          }}
          className="absolute top-5 end-5 p-1.5 rounded-xl bg-purple-950/40 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success Header */}
        <div className="text-center space-y-2 pt-2">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h3 className="text-xl font-black text-white">{t.purchaseSuccess}</h3>
          <p className="text-xs text-slate-300">
            {order.productName} — ({order.durationLabel})
          </p>
        </div>

        {/* Code Delivery Box */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1a1233] to-[#0c0916] border border-purple-400/50 shadow-inner space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-purple-400" />
              {t.yourCodeIs}
            </span>
            <span className="text-[10px] font-mono text-slate-400">ID: {order.id}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-black/80 border border-purple-500/30 flex items-center justify-between gap-3">
            <span className="font-mono text-sm sm:text-base font-black text-emerald-300 tracking-wider break-all select-all">
              {code}
            </span>
            <button
              onClick={handleCopy}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                copied
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-purple-600 hover:bg-purple-500 text-white shadow-md active:scale-95'
              }`}
            >
              {copied ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? t.copied : t.copyCode}</span>
            </button>
          </div>
        </div>

        {/* Details & Info */}
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
          <div className="p-2.5 rounded-xl bg-purple-950/20 border border-purple-500/20">
            <span className="block text-[10px] text-slate-500">المبلغ المخصوم:</span>
            <span className="font-bold text-white">${order.pricePaid.toFixed(2)}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-950/20 border border-purple-500/20">
            <span className="block text-[10px] text-slate-500">حالة الطلب:</span>
            <span className="font-bold text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              مكتمل ومسلّم فورًا
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => {
              soundManager.playClick();
              onViewOrders();
              onClose();
            }}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all text-center"
          >
            {t.orders}
          </button>
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md text-center"
          >
            {t.confirm}
          </button>
        </div>
      </div>
    </div>
  );
};
