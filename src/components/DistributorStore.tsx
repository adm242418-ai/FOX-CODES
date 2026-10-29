import React, { useState } from 'react';
import {
  Store,
  Zap,
  Clock,
  ShieldCheck,
  Send,
  MessageCircle,
  AlertCircle,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles
} from 'lucide-react';
import { Category, InventoryCode, Product, ProductDuration, StoreSettings, UserProfile } from '../types';
import { Language, translations } from '../utils/i18n';
import { soundManager } from '../utils/sound';
import { checkDurationAvailability } from '../utils/storeLogic';

interface DistributorStoreProps {
  products: Product[];
  categories: Category[];
  inventory: InventoryCode[];
  user: UserProfile | null;
  settings: StoreSettings;
  lang: Language;
  onPurchase: (productId: string, durationId: string) => void;
  onOpenTopUp: () => void;
  onOpenAuth: () => void;
}

export const DistributorStore: React.FC<DistributorStoreProps> = ({
  products,
  inventory,
  user,
  settings,
  lang,
  onPurchase,
  onOpenTopUp,
  onOpenAuth
}) => {
  const t = translations[lang];
  const [selectedDurationMap, setSelectedDurationMap] = useState<Record<string, string>>({});

  const isDistributorOrOwner = user?.role === 'distributor' || user?.role === 'owner';

  const handleSelectDuration = (productId: string, durationId: string) => {
    soundManager.playClick();
    setSelectedDurationMap((prev) => ({ ...prev, [productId]: durationId }));
  };

  const handleBuy = (product: Product, duration: ProductDuration, isAvailable: boolean) => {
    soundManager.playClick();
    if (!isAvailable) {
      soundManager.playError();
      return;
    }

    if (!user) {
      onOpenAuth();
      return;
    }

    if (!isDistributorOrOwner) {
      soundManager.playError();
      return;
    }

    if (user.balance < duration.distributorPrice) {
      soundManager.playError();
      onOpenTopUp();
      return;
    }

    onPurchase(product.id, duration.id);
  };

  return (
    <div className="space-y-6">
      {/* Distributor Welcome Banner & Status */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950/80 via-[#180f2d] to-purple-950/80 border border-purple-500/30 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-2 rounded-xl bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30">
                <Store className="w-5 h-5" />
              </span>
              <h2 className="text-xl md:text-2xl font-black text-white">
                {lang === 'ar' ? 'بوابة الموزعين المعتمدين (أسعار الجملة)' : 'Authorized Distributor Wholesale Portal'}
              </h2>
            </div>
            <p className="text-xs md:text-sm text-slate-300 max-w-xl leading-relaxed">
              {lang === 'ar'
                ? 'استمتع بأفضل أسعار الجملة المخصصة للموزعين مع إمكانية معاينة الكميات المتوفرة والشراء الفوري بدون وسيط.'
                : 'Enjoy top wholesale tiers reserved exclusively for verified distributors, with stock visibility and instant delivery.'}
            </p>
          </div>

          {/* Role Status Tag */}
          <div className="flex flex-col items-start md:items-end gap-2">
            {isDistributorOrOwner ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-bold text-xs shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{lang === 'ar' ? 'حسابك معتمد كموزع' : 'Verified Distributor Account'}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-950/80 border border-amber-500/40 text-amber-300 font-bold text-xs shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>{lang === 'ar' ? 'معاينة أسعار الجملة (يتطلب ترقية)' : 'Wholesale Preview (Upgrade required)'}</span>
              </div>
            )}

            {!isDistributorOrOwner && (
              <div className="flex items-center gap-2">
                <a
                  href={settings.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/30 text-xs font-bold hover:bg-[#25D366]/30 transition-all"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'طلب الترقية لموزع' : 'Request Distributor Role'}</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Products with Distributor Wholesale Prices */}
      {products.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-[#0f0c1b]/50 border border-purple-500/15 p-8 flex flex-col items-center justify-center">
          <Store className="w-12 h-12 text-purple-400 mb-3" />
          <h3 className="text-lg font-bold text-slate-100">
            {lang === 'ar' ? 'لا توجد منتجات جملة مسجلة حاليًا' : 'No wholesale products yet'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {lang === 'ar' ? 'يمكن للمالك إضافة المنتجات والأسعار عبر لوحة تحكم الملك.' : 'The store owner can add products via the Owner Dashboard.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => {
            const activeDurations = product.durations.filter((d) => d.isActive);
            const currentDurationId = selectedDurationMap[product.id] || activeDurations[0]?.id;
            const currentDuration = product.durations.find((d) => d.id === currentDurationId) || activeDurations[0];

            const availability = currentDuration
              ? checkDurationAvailability(currentDuration, inventory)
              : { isAvailable: false, availableCount: 0, soldCount: 0, messageKey: 'stockUnavailableMsg' };

            return (
              <div
                key={product.id}
                className="rounded-3xl bg-[#110e20]/90 border border-purple-500/25 p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_0_25px_rgba(168,85,247,0.2)] backdrop-blur-xl"
              >
                <div>
                  {/* Card Header & Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
                      {lang === 'ar' ? 'سعر الجملة' : 'Wholesale'}
                    </span>

                    {/* Stock available count (Distributors are permitted to see available count) */}
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-xl border ${
                        availability.isAvailable
                          ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                          : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                      }`}
                    >
                      {availability.isAvailable
                        ? lang === 'ar'
                          ? `المتوفر: ${availability.availableCount} كود`
                          : `Stock: ${availability.availableCount}`
                        : t.outOfStock}
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-slate-100 mb-1">
                    {lang === 'ar' ? product.nameAr : product.nameEn}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-4">
                    {lang === 'ar' ? product.descriptionAr : product.descriptionEn}
                  </p>

                  {/* Durations */}
                  <div className="mb-4">
                    <span className="text-[11px] font-bold text-slate-400 block mb-2">{t.chooseDuration}</span>
                    <div className="grid grid-cols-2 gap-2">
                      {activeDurations.map((dur) => {
                        const isDurSelected = currentDuration?.id === dur.id;
                        const durAvail = checkDurationAvailability(dur, inventory);
                        return (
                          <button
                            key={dur.id}
                            onClick={() => handleSelectDuration(product.id, dur.id)}
                            className={`p-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center transition-all border ${
                              isDurSelected
                                ? 'bg-fuchsia-600/30 border-fuchsia-400 text-white shadow-[0_0_15px_rgba(217,70,239,0.3)]'
                                : 'bg-purple-950/20 border-purple-500/20 text-slate-300 hover:border-purple-400/40'
                            }`}
                          >
                            <span>{lang === 'ar' ? dur.labelAr : dur.labelEn}</span>
                            <span className="text-[10px] text-fuchsia-400 mt-0.5">${dur.distributorPrice}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Pricing summary */}
                <div className="pt-3 border-t border-purple-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-fuchsia-300 block font-semibold">{t.distributorPrice}</span>
                      <span className="text-2xl font-black text-fuchsia-400">
                        ${currentDuration ? currentDuration.distributorPrice.toFixed(2) : '0.00'}
                      </span>
                    </div>

                    <div className="text-end">
                      <span className="text-[10px] text-slate-400 block">{t.customerPrice}</span>
                      <span className="text-sm font-bold text-slate-400 line-through">
                        ${currentDuration ? currentDuration.customerPrice.toFixed(2) : '0.00'}
                      </span>
                    </div>
                  </div>

                  {!availability.isAvailable ? (
                    <div className="p-2 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                      <span>{t.stockUnavailableMsg}</span>
                    </div>
                  ) : null}

                  <button
                    disabled={!availability.isAvailable || !currentDuration || !isDistributorOrOwner}
                    onClick={() => currentDuration && handleBuy(product, currentDuration, availability.isAvailable)}
                    className={`w-full py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                      availability.isAvailable && isDistributorOrOwner
                        ? 'bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white shadow-[0_0_20px_rgba(217,70,239,0.35)] active:scale-95 cursor-pointer'
                        : 'bg-slate-800/60 text-slate-500 border border-slate-700/50 cursor-not-allowed'
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                    <span>
                      {!isDistributorOrOwner
                        ? lang === 'ar'
                          ? 'يتطلب رتبة موزع للشراء'
                          : 'Distributor Role Required'
                        : availability.isAvailable
                        ? lang === 'ar'
                          ? 'شراء فوري بسعر الموزع'
                          : 'Buy at Distributor Price'
                        : t.outOfStock}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
