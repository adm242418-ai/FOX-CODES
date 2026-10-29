import React, { useState } from 'react';
import { Package, X, Copy, CheckCheck, Clock, Key } from 'lucide-react';
import { Order } from '../types';
import { Language, translations } from '../utils/i18n';
import { soundManager } from '../utils/sound';

interface OrdersModalProps {
  orders: Order[];
  lang: Language;
  onClose: () => void;
}

export const OrdersModal: React.FC<OrdersModalProps> = ({ orders, lang, onClose }) => {
  const t = translations[lang];
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, code: string) => {
    soundManager.playSuccess();
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#120e24] border border-purple-500/40 rounded-3xl p-6 max-w-2xl w-full shadow-2xl relative space-y-4 my-8">
        <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-purple-600/20 border border-purple-500/30 text-purple-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">{t.orders}</h3>
              <p className="text-xs text-purple-300">سجل مشترياتك وأكوادك الرقمية المستلمة</p>
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

        {orders.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            <Package className="w-10 h-10 mx-auto mb-2 text-slate-600" />
            <span>لا توجد طلبات سابقة مسجلة في حسابك.</span>
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {orders.map((ord) => (
              <div
                key={ord.id}
                className="p-4 rounded-2xl bg-[#17112c] border border-purple-500/25 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-white text-sm">{ord.productName}</h4>
                    <span className="text-xs text-purple-300 font-semibold">{ord.durationLabel}</span>
                  </div>
                  <div className="text-end">
                    <span className="text-sm font-black text-emerald-400">${ord.pricePaid.toFixed(2)}</span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      {new Date(ord.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-black/70 border border-purple-500/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Key className="w-4 h-4 text-purple-400 shrink-0" />
                    <span className="font-mono text-xs sm:text-sm text-purple-200 truncate select-all">
                      {ord.codeDelivered}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(ord.id, ord.codeDelivered)}
                    className="px-2.5 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white text-xs font-bold transition-all shrink-0 flex items-center gap-1"
                  >
                    {copiedId === ord.id ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === ord.id ? t.copied : t.copyCode}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
