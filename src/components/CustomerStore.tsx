import React, { useState, useMemo } from 'react';
import {
  Search,
  Zap,
  Clock,
  AlertCircle,
  Tag,
  PackageOpen,
  ArrowRight,
  ShieldCheck,
  Plus
} from 'lucide-react';
import { Category, InventoryCode, Order, Product, ProductDuration, StoreSettings, UserProfile } from '../types';
import { Language, translations } from '../utils/i18n';
import { soundManager } from '../utils/sound';
import { checkDurationAvailability } from '../utils/storeLogic';

interface CustomerStoreProps {
  products: Product[];
  categories: Category[];
  inventory: InventoryCode[];
  user: UserProfile | null;
  settings: StoreSettings;
  lang: Language;
  onPurchase: (productId: string, durationId: string) => void;
  onOpenTopUp: () => void;
  onOpenAuth: () => void;
  onNavigateToOwner: () => void;
}

export const CustomerStore: React.FC<CustomerStoreProps> = ({
  products,
  categories,
  inventory,
  user,
  settings,
  lang,
  onPurchase,
  onOpenTopUp,
  onOpenAuth,
  onNavigateToOwner
}) => {
  const t = translations[lang];
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDurationMap, setSelectedDurationMap] = useState<Record<string, string>>({});

  // Filter products by category, search, and active state
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.isActive) return false;
      const matchCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
      const matchSearch =
        searchQuery.trim() === '' ||
        p.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.descriptionAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.descriptionEn.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

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

    const price = user.role === 'distributor' ? duration.distributorPrice : duration.customerPrice;
    if (user.balance < price) {
      soundManager.playError();
      onOpenTopUp();
      return;
    }

    onPurchase(product.id, duration.id);
  };

  return (
    <div className="space-y-6">
      {/* Search & Category Filter Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#0f0c1b]/80 border border-purple-500/20 backdrop-blur-xl shadow-xl flex flex-col md:flex-row items-center gap-4 justify-between">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-purple-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full ps-10 pe-4 py-2.5 rounded-2xl bg-[#161126] border border-purple-500/30 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all"
          />
        </div>

        {/* Categories Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 scrollbar-none">
          <button
            onClick={() => {
              soundManager.playClick();
              setSelectedCategory('all');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all border ${
              selectedCategory === 'all'
                ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                : 'bg-purple-950/20 text-purple-300 border-purple-500/20 hover:bg-purple-900/30'
            }`}
          >
            {t.allCategories}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                soundManager.playClick();
                setSelectedCategory(cat.id);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all border ${
                selectedCategory === cat.id
                  ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                  : 'bg-purple-950/20 text-purple-300 border-purple-500/20 hover:bg-purple-900/30'
              }`}
            >
              {lang === 'ar' ? cat.nameAr : cat.nameEn}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="py-20 text-center rounded-3xl bg-[#0f0c1b]/50 border border-purple-500/15 p-8 flex flex-col items-center justify-center">
          <div className="p-4 rounded-3xl bg-purple-950/40 border border-purple-500/30 text-purple-400 mb-4 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
            <PackageOpen className="w-12 h-12" />
          </div>
          <h3 className="text-xl font-bold text-slate-100 mb-2">
            {lang === 'ar' ? 'المتجر بانتظار إضافة المنتجات' : 'No products available yet'}
          </h3>
          <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
            {lang === 'ar'
              ? 'لم يتم إضافة أي منتجات بعد. يمكن للمالك الانتقال إلى لوحة تحكم الملك لإضافة المنتجات والمدد والأكواد الرقمية بسهولة.'
              : 'No digital products have been added yet. The store owner can add products and codes via the Owner Dashboard.'}
          </p>
          {user?.role === 'owner' ? (
            <button
              onClick={() => {
                soundManager.playClick();
                onNavigateToOwner();
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-bold text-sm shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'ar' ? 'إضافة منتجات الآن من لوحة المالك' : 'Add Products in Owner Panel'}</span>
            </button>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => {
            // Find currently selected duration for this product (default to first active duration)
            const activeDurations = product.durations.filter((d) => d.isActive);
            const currentDurationId = selectedDurationMap[product.id] || activeDurations[0]?.id;
            const currentDuration = product.durations.find((d) => d.id === currentDurationId) || activeDurations[0];

            const availability = currentDuration
              ? checkDurationAvailability(currentDuration, inventory)
              : { isAvailable: false, availableCount: 0, soldCount: 0, messageKey: 'stockUnavailableMsg' };

            const currentPrice = currentDuration
              ? user?.role === 'distributor'
                ? currentDuration.distributorPrice
                : currentDuration.customerPrice
              : 0;

            return (
              <div
                key={product.id}
                className="group rounded-3xl bg-[#110e20]/90 border border-purple-500/25 hover:border-purple-400/60 p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.25)] relative overflow-hidden backdrop-blur-xl"
              >
                {/* Neon subtle background sheen */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-600/20 transition-all" />

                <div>
                  {/* Product Image / Card Header */}
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-gradient-to-br from-purple-950/60 to-[#0c0a14] border border-purple-500/20 mb-4 flex items-center justify-center">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.nameAr}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-purple-400/80 gap-2">
                        <Zap className="w-10 h-10 drop-shadow-[0_0_10px_#a855f7]" />
                        <span className="text-xs font-bold uppercase tracking-widest text-purple-300">FOX CODES</span>
                      </div>
                    )}

                    {/* Stock Status Badge */}
                    <div className="absolute top-3 end-3">
                      {availability.isAvailable ? (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 text-[11px] font-black shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          {t.available}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/80 border border-rose-500/50 text-rose-300 text-[11px] font-black shadow-[0_0_15px_rgba(244,63,94,0.3)]">
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                          {t.outOfStock}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Product Title & Description */}
                  <h3 className="text-lg font-black text-slate-100 group-hover:text-purple-300 transition-colors mb-1.5">
                    {lang === 'ar' ? product.nameAr : product.nameEn}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4 line-clamp-2">
                    {lang === 'ar' ? product.descriptionAr : product.descriptionEn}
                  </p>

                  {/* Durations Selector */}
                  {activeDurations.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-purple-300 mb-2">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{t.chooseDuration}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {activeDurations.map((dur) => {
                          const isDurSelected = currentDuration?.id === dur.id;
                          const durAvail = checkDurationAvailability(dur, inventory);
                          return (
                            <button
                              key={dur.id}
                              onClick={() => handleSelectDuration(product.id, dur.id)}
                              className={`p-2 rounded-xl text-xs font-semibold flex flex-col items-center justify-center transition-all border ${
                                isDurSelected
                                  ? 'bg-purple-600/30 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                                  : 'bg-purple-950/20 border-purple-500/20 text-slate-300 hover:border-purple-400/40'
                              } ${!durAvail.isAvailable ? 'opacity-60' : ''}`}
                            >
                              <span>{lang === 'ar' ? dur.labelAr : dur.labelEn}</span>
                              <span className="text-[10px] text-purple-300 font-bold mt-0.5">
                                ${user?.role === 'distributor' ? dur.distributorPrice : dur.customerPrice}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Actions: Price, Stock Warning, Buy Button */}
                <div className="pt-3 border-t border-purple-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">
                        {user?.role === 'distributor' ? t.distributorPrice : t.customerPrice}
                      </span>
                      <span className="text-2xl font-black text-white bg-gradient-to-r from-purple-300 to-fuchsia-300 bg-clip-text text-transparent">
                        ${currentPrice.toFixed(2)}
                      </span>
                    </div>

                    <div className="text-end">
                      <span className="text-[10px] text-purple-400 flex items-center gap-1 justify-end font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        {t.instantDelivery}
                      </span>
                    </div>
                  </div>

                  {/* Out of Stock Warning Message if unavailable */}
                  {!availability.isAvailable ? (
                    <div className="p-2 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                      <span>{t.stockUnavailableMsg}</span>
                    </div>
                  ) : null}

                  {/* Purchase Button */}
                  <button
                    disabled={!availability.isAvailable || !currentDuration}
                    onClick={() => currentDuration && handleBuy(product, currentDuration, availability.isAvailable)}
                    className={`w-full py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all duration-300 ${
                      availability.isAvailable
                        ? 'bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] active:scale-95 cursor-pointer'
                        : 'bg-slate-800/60 text-slate-500 border border-slate-700/50 cursor-not-allowed'
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                    <span>{availability.isAvailable ? t.buyNow : t.outOfStock}</span>
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
