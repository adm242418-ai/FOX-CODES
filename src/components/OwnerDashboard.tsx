import React, { useState } from 'react';
import {
  Crown,
  Palette,
  Package,
  Users,
  Settings as SettingsIcon,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Clock,
  DollarSign,
  Key,
  ShieldAlert,
  Save,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Copy,
  CheckCheck,
  Eye,
  AlertTriangle
} from 'lucide-react';
import {
  Category,
  InventoryCode,
  Order,
  Product,
  ProductDuration,
  StoreSettings,
  TopUpRequest,
  UserProfile,
  UserRole
} from '../types';
import { Language, translations } from '../utils/i18n';
import { soundManager } from '../utils/sound';
import { OWNER_EMAIL } from '../utils/storeLogic';
import { FoxLogo } from './FoxLogo';

interface OwnerDashboardProps {
  user: UserProfile | null;
  settings: StoreSettings;
  products: Product[];
  categories: Category[];
  inventory: InventoryCode[];
  users: UserProfile[];
  topUps: TopUpRequest[];
  orders: Order[];
  lang: Language;
  onUpdateSettings: (newSettings: Partial<StoreSettings>) => void;
  onResetSettings: () => void;
  onSaveProduct: (prod: Product) => void;
  onDeleteProduct: (id: string) => void;
  onAddCodes: (productId: string, durationId: string, codesText: string) => void;
  onDeleteCode: (codeId: string) => void;
  onToggleCode: (codeId: string) => void;
  onUpdateUserRole: (userId: string, newRole: UserRole) => void;
  onAdjustBalance: (userId: string, amount: number, reason: string) => void;
  onApproveTopUp: (requestId: string) => void;
  onRejectTopUp: (requestId: string, reason: string) => void;
  onOpenAuth: () => void;
  isMaintenance?: boolean;
  onToggleMaintenance?: (status: boolean) => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({
  user,
  settings,
  products,
  categories,
  inventory,
  users,
  topUps,
  orders,
  lang,
  onUpdateSettings,
  onResetSettings,
  onSaveProduct,
  onDeleteProduct,
  onAddCodes,
  onDeleteCode,
  onToggleCode,
  onUpdateUserRole,
  onAdjustBalance,
  onApproveTopUp,
  onRejectTopUp,
  onOpenAuth,
  isMaintenance = false,
  onToggleMaintenance
}) => {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<'customization' | 'products' | 'users' | 'settings'>('customization');

  // Site Customization form state
  const [formSettings, setFormSettings] = useState<StoreSettings>({ ...settings });
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // Product Add / Edit Modal state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Codes management modal
  const [codesModalProduct, setCodesModalProduct] = useState<Product | null>(null);
  const [codesModalDuration, setCodesModalDuration] = useState<ProductDuration | null>(null);
  const [rawCodesInput, setRawCodesInput] = useState('');

  // Balance Adjustment modal
  const [adjustUserModal, setAdjustUserModal] = useState<UserProfile | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustType, setAdjustType] = useState<'add' | 'deduct'>('add');
  const [adjustReason, setAdjustReason] = useState('');

  // Rejection modal
  const [rejectingTopUpId, setRejectingTopUpId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // SQL Schema copy feedback
  const [copiedSql, setCopiedSql] = useState(false);

  // Security Check: is this the authorized owner?
  const isOwner = user?.role === 'owner' || user?.email.toLowerCase() === OWNER_EMAIL.toLowerCase();

  // If NOT the verified owner, render strict security gate!
  if (!isOwner) {
    return (
      <div className="py-16 px-4 max-w-2xl mx-auto text-center">
        <div className="p-8 rounded-3xl bg-[#140e24] border border-amber-500/40 shadow-[0_0_40px_rgba(245,158,11,0.2)] backdrop-blur-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center mb-5">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">
            {lang === 'ar' ? 'منطقة المالك المحمية' : 'Restricted Owner Portal'}
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed mb-6">
            {lang === 'ar'
              ? `لوحة تحكم الملك مخصصة فقط لحساب المالك المعتمد (${OWNER_EMAIL}). الاختيارات السابقة للتنقل وعرض الأقسام فقط، ولا تمنح أي شخص صلاحيات إدارية دون تسجيل الدخول بحساب المالك.`
              : `The Owner Dashboard is strictly restricted to the verified store owner (${OWNER_EMAIL}).`}
          </p>

          <button
            onClick={() => {
              soundManager.playClick();
              onOpenAuth();
            }}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-bold text-sm shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all active:scale-95"
          >
            {lang === 'ar' ? 'تسجيل الدخول بحساب المالك' : 'Sign In as Store Owner'}
          </button>
        </div>
      </div>
    );
  }

  // Handle Save Settings
  const handleSaveSettings = () => {
    soundManager.playSuccess();
    onUpdateSettings(formSettings);
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 3000);
  };

  // Handle Add / Edit Product
  const openNewProductModal = () => {
    soundManager.playClick();
    setEditingProduct({
      id: 'PRD-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      nameAr: '',
      nameEn: '',
      descriptionAr: '',
      descriptionEn: '',
      categoryId: categories[0]?.id || '',
      imageUrl: '',
      isActive: true,
      durations: [
        {
          id: 'DUR-1D-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
          productId: '',
          durationKey: '1d',
          labelAr: 'يوم واحد',
          labelEn: '1 Day',
          customerPrice: 10,
          distributorPrice: 7,
          isActive: true
        },
        {
          id: 'DUR-1W-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
          productId: '',
          durationKey: '1w',
          labelAr: 'أسبوع',
          labelEn: '1 Week',
          customerPrice: 30,
          distributorPrice: 20,
          isActive: true
        },
        {
          id: 'DUR-1M-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
          productId: '',
          durationKey: '1m',
          labelAr: 'شهر',
          labelEn: '1 Month',
          customerPrice: 80,
          distributorPrice: 55,
          isActive: true
        }
      ],
      createdAt: new Date().toISOString()
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    soundManager.playSuccess();

    // Ensure durations have productId correctly wired
    const finalProduct: Product = {
      ...editingProduct,
      durations: editingProduct.durations.map((d) => ({
        ...d,
        productId: editingProduct.id
      }))
    };

    onSaveProduct(finalProduct);
    setIsProductModalOpen(false);
    setEditingProduct(null);
  };

  // Submit Inventory Codes
  const handleAddCodesSubmit = () => {
    if (!codesModalProduct || !codesModalDuration || !rawCodesInput.trim()) return;
    soundManager.playSuccess();
    onAddCodes(codesModalProduct.id, codesModalDuration.id, rawCodesInput);
    setRawCodesInput('');
  };

  // Balance Adjustment submit
  const handleAdjustBalanceSubmit = () => {
    if (!adjustUserModal || !adjustAmount) return;
    const val = parseFloat(adjustAmount);
    if (isNaN(val) || val <= 0) return;

    soundManager.playSuccess();
    const finalAmount = adjustType === 'add' ? val : -val;
    onAdjustBalance(adjustUserModal.id, finalAmount, adjustReason || 'تعديل إداري');
    setAdjustUserModal(null);
    setAdjustAmount('');
    setAdjustReason('');
  };

  // TopUp Reject submit
  const handleRejectSubmit = () => {
    if (!rejectingTopUpId) return;
    soundManager.playClick();
    onRejectTopUp(rejectingTopUpId, rejectionReason || 'البيانات غير مطابقة');
    setRejectingTopUpId(null);
    setRejectionReason('');
  };

  // Calculate live stats
  const totalRevenue = orders.reduce((sum, o) => sum + o.pricePaid, 0);
  const totalUnsoldCodes = inventory.filter((c) => !c.isSold && c.isActive).length;
  const pendingTopUpsCount = topUps.filter((t) => t.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950/90 via-[#180f2d] to-purple-950/90 border border-purple-500/30 backdrop-blur-xl shadow-2xl relative">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              <Crown className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white">{t.ownerDashboard}</h1>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {OWNER_EMAIL}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                {lang === 'ar'
                  ? 'إدارة المتجر بالكامل، تخصيص المظهر، إدارة الأكواد والمخزون الحقيقي، والتحكم في الأرصدة والموزعين.'
                  : 'Complete store management, brand customization, real codes inventory, and user clearance.'}
              </p>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-2.5 w-full md:w-auto">
            <div className="p-2.5 rounded-2xl bg-purple-950/40 border border-purple-500/20 text-center">
              <span className="text-[10px] text-purple-300 block font-semibold">{t.totalSales}</span>
              <span className="text-base font-black text-emerald-400">${totalRevenue.toFixed(2)}</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-purple-950/40 border border-purple-500/20 text-center">
              <span className="text-[10px] text-purple-300 block font-semibold">{t.totalInventory}</span>
              <span className="text-base font-black text-purple-300">{totalUnsoldCodes}</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-purple-950/40 border border-purple-500/20 text-center">
              <span className="text-[10px] text-purple-300 block font-semibold">طلبات شحن</span>
              <span className="text-base font-black text-amber-400">{pendingTopUpsCount}</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-1 scrollbar-none border-t border-purple-500/20 pt-4">
          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('customization');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold shrink-0 transition-all border ${
              activeTab === 'customization'
                ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                : 'bg-purple-950/20 text-slate-300 border-purple-500/20 hover:bg-purple-900/30'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>{t.siteCustomization}</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('products');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold shrink-0 transition-all border ${
              activeTab === 'products'
                ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                : 'bg-purple-950/20 text-slate-300 border-purple-500/20 hover:bg-purple-900/30'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>{t.productsManagement}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-purple-900 text-[10px] text-purple-200">
              {products.length}
            </span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('users');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold shrink-0 transition-all border ${
              activeTab === 'users'
                ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                : 'bg-purple-950/20 text-slate-300 border-purple-500/20 hover:bg-purple-900/30'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{t.customersDistributors}</span>
            {pendingTopUpsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black font-black text-[10px] animate-pulse">
                {pendingTopUpsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('settings');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold shrink-0 transition-all border ${
              activeTab === 'settings'
                ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                : 'bg-purple-950/20 text-slate-300 border-purple-500/20 hover:bg-purple-900/30'
            }`}
          >
            <SettingsIcon className="w-4 h-4" />
            <span>{t.storeSettings}</span>
          </button>
        </div>
      </div>

      {/* TAB 1: SITE CUSTOMIZATION (تخصيص الموقع) */}
      {activeTab === 'customization' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings Editor Form */}
          <div className="lg:col-span-2 p-6 rounded-3xl bg-[#110e20]/90 border border-purple-500/25 backdrop-blur-xl shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Palette className="w-5 h-5 text-purple-400" />
                <span>{t.siteCustomization}</span>
              </h2>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    soundManager.playClick();
                    onResetSettings();
                    setFormSettings({ ...settings });
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t.resetDefaults}</span>
                </button>
                <button
                  onClick={handleSaveSettings}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white text-xs font-bold shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all active:scale-95"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{t.saveChanges}</span>
                </button>
              </div>
            </div>

            {saveSuccessNotice && (
              <div className="p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                <CheckCheck className="w-4 h-4 text-emerald-400" />
                <span>{t.customizationSaved}</span>
              </div>
            )}

            {/* Logo & Banner fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-purple-300 block mb-1.5">{t.logoSettings}</label>
                <input
                  type="text"
                  value={formSettings.logoUrl}
                  onChange={(e) => setFormSettings({ ...formSettings, logoUrl: e.target.value })}
                  placeholder="رابط صورة الشعار (URL) أو اتركه فارغًا للوجو الافتراضي"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#17122a] border border-purple-500/30 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-purple-300 block mb-1.5">{t.coverSettings}</label>
                <input
                  type="text"
                  value={formSettings.bannerUrl}
                  onChange={(e) => setFormSettings({ ...formSettings, bannerUrl: e.target.value })}
                  placeholder="رابط صورة البنر العلوي (URL)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#17122a] border border-purple-500/30 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>

            {/* Store Name & Tagline */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-purple-300 block mb-1.5">اسم المتجر (عربي)</label>
                <input
                  type="text"
                  value={formSettings.storeNameAr}
                  onChange={(e) => setFormSettings({ ...formSettings, storeNameAr: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#17122a] border border-purple-500/30 text-xs text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-purple-300 block mb-1.5">اسم المتجر (English)</label>
                <input
                  type="text"
                  value={formSettings.storeNameEn}
                  onChange={(e) => setFormSettings({ ...formSettings, storeNameEn: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#17122a] border border-purple-500/30 text-xs text-white focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-purple-300 block mb-1.5">{t.taglineField} (عربي)</label>
              <input
                type="text"
                value={formSettings.taglineAr}
                onChange={(e) => setFormSettings({ ...formSettings, taglineAr: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#17122a] border border-purple-500/30 text-xs text-white focus:outline-none focus:border-purple-400"
              />
            </div>

            {/* Announcement bar */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-purple-300">{t.announcementField}</label>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-purple-300">
                  <input
                    type="checkbox"
                    checked={formSettings.showAnnouncement}
                    onChange={(e) => setFormSettings({ ...formSettings, showAnnouncement: e.target.checked })}
                    className="accent-purple-500"
                  />
                  <span>تفعيل الشريط</span>
                </label>
              </div>
              <input
                type="text"
                value={formSettings.announcementAr}
                onChange={(e) => setFormSettings({ ...formSettings, announcementAr: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#17122a] border border-purple-500/30 text-xs text-white focus:outline-none focus:border-purple-400"
              />
            </div>

            {/* Colors & Fonts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-purple-500/20">
              <div>
                <label className="text-xs font-bold text-purple-300 block mb-1.5">{t.primaryColor}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formSettings.primaryColor}
                    onChange={(e) => setFormSettings({ ...formSettings, primaryColor: e.target.value })}
                    className="w-10 h-10 rounded-xl bg-transparent border-0 cursor-pointer"
                  />
                  <span className="text-xs font-mono text-slate-300">{formSettings.primaryColor}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-purple-300 block mb-1.5">{t.secondaryColor}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formSettings.secondaryColor}
                    onChange={(e) => setFormSettings({ ...formSettings, secondaryColor: e.target.value })}
                    className="w-10 h-10 rounded-xl bg-transparent border-0 cursor-pointer"
                  />
                  <span className="text-xs font-mono text-slate-300">{formSettings.secondaryColor}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-purple-300 block mb-1.5">{t.fontSelection}</label>
                <select
                  value={formSettings.fontFamily}
                  onChange={(e) => setFormSettings({ ...formSettings, fontFamily: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#17122a] border border-purple-500/30 text-xs text-white focus:outline-none"
                >
                  <option value="'Cairo', sans-serif">Cairo (افتراضي فاخر)</option>
                  <option value="'Tajawal', sans-serif">Tajawal (حديث وأنيق)</option>
                  <option value="'IBM Plex Sans Arabic', sans-serif">IBM Plex Sans Arabic (تقني دقيق)</option>
                  <option value="'Almarai', sans-serif">Almarai (واضح ومريح)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="p-6 rounded-3xl bg-[#0f0c1b]/90 border border-purple-500/25 backdrop-blur-xl shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4 text-purple-300 text-xs font-bold uppercase tracking-wider">
                <Eye className="w-4 h-4" />
                <span>{t.previewChanges}</span>
              </div>

              <div className="rounded-2xl bg-[#08070d] border border-purple-500/40 p-4 space-y-3 shadow-inner">
                <div className="flex items-center gap-3">
                  <FoxLogo customLogoUrl={formSettings.logoUrl} size="md" />
                  <div>
                    <h4 className="text-base font-black text-white">{formSettings.storeNameAr}</h4>
                    <p className="text-[10px] text-slate-400 line-clamp-1">{formSettings.taglineAr}</p>
                  </div>
                </div>

                {formSettings.showAnnouncement && (
                  <div className="p-2 rounded-xl bg-purple-950/60 border border-purple-500/30 text-[10px] text-purple-200 text-center font-medium">
                    {formSettings.announcementAr}
                  </div>
                )}

                <div className="p-3 rounded-xl bg-[#141026] border border-purple-500/30 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">بطاقة منتج تجريبية</span>
                    <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/40">
                      متوفر
                    </span>
                  </div>
                  <div
                    className="w-full py-2 rounded-xl text-center text-xs font-bold text-white shadow-lg"
                    style={{ backgroundColor: formSettings.primaryColor }}
                  >
                    زر شراء فوري
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-purple-500/20 text-[11px] text-slate-400 text-center">
              يتم حفظ التخصيص في المتجر ويظهر لجميع الزوار فورًا.
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCTS & INVENTORY MANAGEMENT (إدارة المنتجات والأكواد) */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-3xl bg-[#110e20]/80 border border-purple-500/20">
            <div>
              <h2 className="text-lg font-black text-white">{t.productsManagement}</h2>
              <p className="text-xs text-slate-400">
                إضافة المنتجات والمدد المختلفة (ساعة، يوم، أسبوع...) وإدخال الأكواد الرقمية الفعلية في المخزون.
              </p>
            </div>
            <button
              onClick={openNewProductModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{t.addProduct}</span>
            </button>
          </div>

          {products.length === 0 ? (
            <div className="py-16 text-center rounded-3xl bg-[#0f0c1b]/50 border border-purple-500/15 p-8 flex flex-col items-center justify-center">
              <Package className="w-12 h-12 text-purple-400 mb-3" />
              <h3 className="text-base font-bold text-slate-100">{t.noProductsYet}</h3>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                لا توجد منتجات مسجلة. اضغط على «إضافة منتج جديد» لبدء بيع الأكواد.
              </p>
              <button
                onClick={openNewProductModal}
                className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold"
              >
                {t.addProduct}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {products.map((prod) => {
                // Compute total unsold codes for this product
                const prodCodes = inventory.filter((c) => c.productId === prod.id);
                const unsoldTotal = prodCodes.filter((c) => !c.isSold && c.isActive).length;
                const soldTotal = prodCodes.filter((c) => c.isSold).length;

                return (
                  <div
                    key={prod.id}
                    className="p-5 rounded-3xl bg-[#110e20]/90 border border-purple-500/25 backdrop-blur-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-950 to-black border border-purple-500/30 overflow-hidden shrink-0 flex items-center justify-center">
                        {prod.imageUrl ? (
                          <img src={prod.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-7 h-7 text-purple-400" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-black text-white">{prod.nameAr}</h3>
                          <span className="text-xs text-slate-400">({prod.nameEn})</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              prod.isActive
                                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {prod.isActive ? t.statusActive : t.statusInactive}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-1">{prod.descriptionAr}</p>

                        {/* Durations badges */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {prod.durations.map((d) => {
                            const dCodes = prodCodes.filter((c) => c.durationId === d.id);
                            const dUnsold = dCodes.filter((c) => !c.isSold && c.isActive).length;
                            return (
                              <button
                                key={d.id}
                                onClick={() => {
                                  soundManager.playClick();
                                  setCodesModalProduct(prod);
                                  setCodesModalDuration(d);
                                }}
                                className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 border transition-all ${
                                  dUnsold > 0
                                    ? 'bg-purple-950/40 border-purple-500/30 text-purple-200 hover:border-purple-400'
                                    : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
                                }`}
                              >
                                <span>{d.labelAr}</span>
                                <span className="font-bold text-amber-400">(${d.customerPrice})</span>
                                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-md bg-purple-900/60 text-purple-300">
                                  {dUnsold} كود
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Stock numbers & Actions */}
                    <div className="flex items-center gap-3 self-end lg:self-center">
                      <div className="text-end">
                        <span className="text-[10px] text-slate-400 block font-semibold">المخزون المتوفر</span>
                        <span className="text-sm font-black text-emerald-400">{unsoldTotal} كود</span>
                        <span className="text-[10px] text-slate-500 block">المباع: {soldTotal}</span>
                      </div>

                      <button
                        onClick={() => {
                          soundManager.playClick();
                          setEditingProduct(prod);
                          setIsProductModalOpen(true);
                        }}
                        className="p-2.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/30 text-purple-300 hover:text-white transition-all"
                        title={t.editProduct}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          soundManager.playClick();
                          if (confirm(`هل أنت متأكد من حذف منتج "${prod.nameAr}"؟`)) {
                            onDeleteProduct(prod.id);
                          }
                        }}
                        className="p-2.5 rounded-xl bg-rose-950/30 hover:bg-rose-900/40 border border-rose-500/30 text-rose-400 hover:text-rose-200 transition-all"
                        title={t.deleteProduct}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: USERS & TOP-UPS MANAGEMENT (العملاء والموزعين وطلبات الشحن) */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Top-up Requests Section */}
          <div className="p-6 rounded-3xl bg-[#110e20]/90 border border-purple-500/25 backdrop-blur-xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-white">{t.topUpRequestsList}</h2>
                <p className="text-xs text-slate-400">مراجعة طلبات الشحن المقدمة من العملاء والموزعين وإضافة الرصيد.</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold">
                {pendingTopUpsCount} معلق
              </span>
            </div>

            {topUps.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">لا توجد طلبات شحن حاليًا.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-start text-xs">
                  <thead>
                    <tr className="border-b border-purple-500/20 text-purple-300 font-bold">
                      <th className="py-2.5 px-3 text-start">{t.userEmail}</th>
                      <th className="py-2.5 px-3 text-start">{t.amountInUSD}</th>
                      <th className="py-2.5 px-3 text-start">{t.paymentMethod}</th>
                      <th className="py-2.5 px-3 text-start">{t.transactionRef}</th>
                      <th className="py-2.5 px-3 text-start">الحالة</th>
                      <th className="py-2.5 px-3 text-center">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-500/10">
                    {topUps.map((req) => (
                      <tr key={req.id} className="hover:bg-purple-950/20">
                        <td className="py-3 px-3 font-medium text-slate-200">{req.userEmail}</td>
                        <td className="py-3 px-3 font-black text-emerald-400">${req.amount.toFixed(2)}</td>
                        <td className="py-3 px-3 text-slate-300">{req.paymentMethod}</td>
                        <td className="py-3 px-3 font-mono text-purple-300">{req.transactionReference}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              req.status === 'approved'
                                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40'
                                : req.status === 'rejected'
                                ? 'bg-rose-950/60 text-rose-300 border border-rose-500/40'
                                : 'bg-amber-950/60 text-amber-300 border border-amber-500/40'
                            }`}
                          >
                            {req.status === 'approved' ? t.approved : req.status === 'rejected' ? t.rejected : t.pending}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {req.status === 'pending' ? (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  soundManager.playSuccess();
                                  onApproveTopUp(req.id);
                                }}
                                className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all"
                              >
                                {t.approveRequest}
                              </button>
                              <button
                                onClick={() => {
                                  soundManager.playClick();
                                  setRejectingTopUpId(req.id);
                                }}
                                className="px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all"
                              >
                                {t.rejectRequest}
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-500">تمت المراجعة</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Registered Users List */}
          <div className="p-6 rounded-3xl bg-[#110e20]/90 border border-purple-500/25 backdrop-blur-xl shadow-xl space-y-4">
            <h2 className="text-lg font-black text-white">{t.usersList}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs">
                <thead>
                  <tr className="border-b border-purple-500/20 text-purple-300 font-bold">
                    <th className="py-2.5 px-3 text-start">{t.userEmail}</th>
                    <th className="py-2.5 px-3 text-start">{t.userRoleCol}</th>
                    <th className="py-2.5 px-3 text-start">{t.userBalanceCol}</th>
                    <th className="py-2.5 px-3 text-center">الرتبة</th>
                    <th className="py-2.5 px-3 text-center">تعديل الرصيد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-500/10">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-purple-950/20">
                      <td className="py-3 px-3 font-medium text-slate-200">{u.email}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            u.role === 'owner'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : u.role === 'distributor'
                              ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40'
                              : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                          }`}
                        >
                          {u.role === 'owner' ? t.ownerRole : u.role === 'distributor' ? t.distributorRole : t.customerRole}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-black text-emerald-400">${u.balance.toFixed(2)}</td>
                      <td className="py-3 px-3 text-center">
                        {u.role !== 'owner' ? (
                          <button
                            onClick={() => {
                              soundManager.playClick();
                              onUpdateUserRole(u.id, u.role === 'distributor' ? 'customer' : 'distributor');
                            }}
                            className="px-2.5 py-1 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/30 text-purple-300 hover:text-white transition-all text-[11px]"
                          >
                            {u.role === 'distributor' ? t.makeCustomer : t.makeDistributor}
                          </button>
                        ) : (
                          <span className="text-[10px] text-amber-400 font-bold">المالك الأصلي</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => {
                            soundManager.playClick();
                            setAdjustUserModal(u);
                            setAdjustAmount('');
                          }}
                          className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-semibold"
                        >
                          {t.adjustBalance}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: STORE SETTINGS & SUPABASE GUIDE (إعدادات المتجر والدعم) */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Firebase Maintenance Mode Control */}
          <div className="lg:col-span-2 p-6 rounded-3xl bg-[#140e24]/90 border border-purple-500/30 backdrop-blur-xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2">
                <span className={`p-2 rounded-xl border ${isMaintenance ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'}`}>
                  <AlertTriangle className="w-5 h-5" />
                </span>
                <h2 className="text-lg font-black text-white">وضع الصيانة (Firebase Maintenance Mode)</h2>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${isMaintenance ? 'bg-amber-950/80 text-amber-300 border-amber-500/40 animate-pulse' : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'}`}>
                  {isMaintenance ? 'وضع الصيانة مفعّل حاليًا ⚠️' : 'المتجر يعمل بشكل طبيعي ✅'}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                عند تفعيل وضع الصيانة، يتم حفظ الحالة في قاعدة بيانات Firebase السحابية، وتظهر لجميع الزوار شاشة الصيانة بالرسالة المعتمدة:
                <span className="block mt-1 font-mono text-[11px] text-purple-300 dir-ltr text-start">
                  "Sorry, we're currently performing maintenance. Please try again later."
                </span>
              </p>
            </div>

            <button
              onClick={() => {
                soundManager.playClick();
                if (onToggleMaintenance) {
                  onToggleMaintenance(!isMaintenance);
                }
              }}
              className={`px-6 py-3 rounded-2xl font-bold text-xs sm:text-sm shadow-xl transition-all duration-300 active:scale-95 shrink-0 ${
                isMaintenance
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white'
                  : 'bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.3)]'
              }`}
            >
              {isMaintenance ? 'إيقاف وضع الصيانة وإعادة المتجر للعمل' : 'تفعيل وضع الصيانة وإغلاق المتجر مؤقتًا'}
            </button>
          </div>

          {/* Contact settings */}
          <div className="p-6 rounded-3xl bg-[#110e20]/90 border border-purple-500/25 backdrop-blur-xl shadow-xl space-y-4">
            <h2 className="text-lg font-black text-white">{t.contactOwner}</h2>
            <p className="text-xs text-slate-400">
              تعديل بيانات التواصل الرسمية الظاهرة للعملاء والموزعين (تيليجرام وواتساب).
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-purple-300 block mb-1">يوزر تيليجرام</label>
                <input
                  type="text"
                  value={formSettings.telegramHandle}
                  onChange={(e) => setFormSettings({ ...formSettings, telegramHandle: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#17122a] border border-purple-500/30 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-purple-300 block mb-1">رابط تيليجرام المباشر</label>
                <input
                  type="text"
                  value={formSettings.telegramUrl}
                  onChange={(e) => setFormSettings({ ...formSettings, telegramUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#17122a] border border-purple-500/30 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-purple-300 block mb-1">رقم واتساب الرسمي</label>
                <input
                  type="text"
                  value={formSettings.whatsappNumber}
                  onChange={(e) => setFormSettings({ ...formSettings, whatsappNumber: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#17122a] border border-purple-500/30 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-purple-300 block mb-1">رابط واتساب المباشر</label>
                <input
                  type="text"
                  value={formSettings.whatsappUrl}
                  onChange={(e) => setFormSettings({ ...formSettings, whatsappUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#17122a] border border-purple-500/30 text-xs text-white"
                />
              </div>
            </div>

            <button
              onClick={handleSaveSettings}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg transition-all"
            >
              حفظ بيانات التواصل
            </button>
          </div>

          {/* Supabase & Deployment Guide */}
          <div className="p-6 rounded-3xl bg-[#0f0c1b]/90 border border-purple-500/25 backdrop-blur-xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-white">{t.supabaseInstructions}</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                SQL Ready
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              الملف الكامل <span className="font-mono text-purple-300">supabase_schema.sql</span> جاهز في المشروع.
              يحتوي على جميع الجداول، سياسات الأمان RLS، دالة الشراء الذرية لمنع البيع المكرر، وتعيين حساب المالك تلقائيًا.
            </p>

            <div className="p-3.5 rounded-2xl bg-black/60 border border-purple-500/30 space-y-2">
              <span className="text-[11px] font-bold text-purple-300 block">خطوات الربط الخارجي:</span>
              <ol className="text-xs text-slate-400 space-y-1.5 list-decimal list-inside">
                <li>أنشئ مشروعًا جديدًا في Supabase (مجاني).</li>
                <li>افتح قسم SQL Editor في لوحة Supabase.</li>
                <li>انسخ محتوى ملف <span className="font-mono text-purple-300">supabase_schema.sql</span> واضغط Run.</li>
                <li>ضع <span className="font-mono text-purple-300">VITE_SUPABASE_URL</span> و <span className="font-mono text-purple-300">VITE_SUPABASE_ANON_KEY</span> في متغيرات البيئة.</li>
              </ol>
            </div>

            <div className="p-3 rounded-2xl bg-purple-950/30 border border-purple-500/30 flex items-center justify-between">
              <span className="text-xs text-purple-200 font-medium">ملف الترحيل: supabase_schema.sql</span>
              <a
                href="/supabase_schema.sql"
                download="supabase_schema.sql"
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all"
              >
                تنزيل ملف SQL
              </a>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT PRODUCT */}
      {isProductModalOpen && editingProduct && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#120d24] border border-purple-500/40 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
              <h3 className="text-lg font-black text-white">
                {editingProduct.id.includes('PRD-') && !products.some((p) => p.id === editingProduct.id)
                  ? t.addProduct
                  : t.editProduct}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProductSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-purple-300 block mb-1">{t.productNameAr}</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.nameAr}
                    onChange={(e) => setEditingProduct({ ...editingProduct, nameAr: e.target.value })}
                    placeholder="مثال: مفتاح تفعيل ويندوز 11 برو"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a1430] border border-purple-500/30 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-purple-300 block mb-1">{t.productNameEn}</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.nameEn}
                    onChange={(e) => setEditingProduct({ ...editingProduct, nameEn: e.target.value })}
                    placeholder="e.g. Windows 11 Pro Key"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a1430] border border-purple-500/30 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-purple-300 block mb-1">{t.productDescAr}</label>
                <textarea
                  rows={2}
                  value={editingProduct.descriptionAr}
                  onChange={(e) => setEditingProduct({ ...editingProduct, descriptionAr: e.target.value })}
                  placeholder="وصف المنتج والميزات..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#1a1430] border border-purple-500/30 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-purple-300 block mb-1">{t.productImage}</label>
                  <input
                    type="text"
                    value={editingProduct.imageUrl}
                    onChange={(e) => setEditingProduct({ ...editingProduct, imageUrl: e.target.value })}
                    placeholder="رابط الصورة (URL)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a1430] border border-purple-500/30 text-xs text-white"
                  />
                </div>

                <div className="flex items-center gap-3 pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-purple-200">
                    <input
                      type="checkbox"
                      checked={editingProduct.isActive}
                      onChange={(e) => setEditingProduct({ ...editingProduct, isActive: e.target.checked })}
                      className="accent-purple-500"
                    />
                    <span>{t.statusActive} (متاح في المتجر)</span>
                  </label>
                </div>
              </div>

              {/* Durations list editor */}
              <div className="space-y-3 pt-3 border-t border-purple-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-300">{t.durationsAndPrices}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const newDur: ProductDuration = {
                        id: 'DUR-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
                        productId: editingProduct.id,
                        durationKey: 'custom',
                        labelAr: 'مدة مخصصة',
                        labelEn: 'Custom',
                        customerPrice: 20,
                        distributorPrice: 15,
                        isActive: true
                      };
                      setEditingProduct({
                        ...editingProduct,
                        durations: [...editingProduct.durations, newDur]
                      });
                    }}
                    className="text-[11px] text-fuchsia-400 hover:text-fuchsia-300 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t.addDuration}</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {editingProduct.durations.map((dur, idx) => (
                    <div
                      key={dur.id}
                      className="p-3 rounded-2xl bg-[#16102b] border border-purple-500/20 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center"
                    >
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">المدة بالعربية</span>
                        <input
                          type="text"
                          value={dur.labelAr}
                          onChange={(e) => {
                            const copy = [...editingProduct.durations];
                            copy[idx].labelAr = e.target.value;
                            setEditingProduct({ ...editingProduct, durations: copy });
                          }}
                          className="w-full px-2 py-1.5 rounded-lg bg-[#20183b] border border-purple-500/30 text-xs text-white"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">سعر العميل ($)</span>
                        <input
                          type="number"
                          step="0.5"
                          value={dur.customerPrice}
                          onChange={(e) => {
                            const copy = [...editingProduct.durations];
                            copy[idx].customerPrice = parseFloat(e.target.value) || 0;
                            setEditingProduct({ ...editingProduct, durations: copy });
                          }}
                          className="w-full px-2 py-1.5 rounded-lg bg-[#20183b] border border-purple-500/30 text-xs text-white"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] text-fuchsia-400 block mb-0.5">سعر الموزع ($)</span>
                        <input
                          type="number"
                          step="0.5"
                          value={dur.distributorPrice}
                          onChange={(e) => {
                            const copy = [...editingProduct.durations];
                            copy[idx].distributorPrice = parseFloat(e.target.value) || 0;
                            setEditingProduct({ ...editingProduct, durations: copy });
                          }}
                          className="w-full px-2 py-1.5 rounded-lg bg-[#20183b] border border-purple-500/30 text-xs text-white"
                        />
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-2 pt-3 sm:pt-0">
                        <label className="flex items-center gap-1 text-[10px] text-slate-300">
                          <input
                            type="checkbox"
                            checked={dur.isActive}
                            onChange={(e) => {
                              const copy = [...editingProduct.durations];
                              copy[idx].isActive = e.target.checked;
                              setEditingProduct({ ...editingProduct, durations: copy });
                            }}
                            className="accent-purple-500"
                          />
                          <span>مفعل</span>
                        </label>

                        {editingProduct.durations.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const copy = editingProduct.durations.filter((_, i) => i !== idx);
                              setEditingProduct({ ...editingProduct, durations: copy });
                            }}
                            className="p-1 text-rose-400 hover:text-rose-300"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-purple-500/20">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white text-xs font-bold shadow-lg"
                >
                  {t.saveProduct}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CODES & INVENTORY MANAGEMENT PER DURATION */}
      {codesModalProduct && codesModalDuration && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#120d24] border border-purple-500/40 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
              <div>
                <h3 className="text-base font-black text-white">{t.manageCodes}</h3>
                <p className="text-xs text-purple-300">
                  {codesModalProduct.nameAr} — مدة: {codesModalDuration.labelAr}
                </p>
              </div>
              <button
                onClick={() => {
                  setCodesModalProduct(null);
                  setCodesModalDuration(null);
                }}
                className="p-1 rounded-xl text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Input to insert new codes */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-purple-300 block">
                {t.addCodesButton} ({t.enterCodesPlaceholder})
              </label>
              <textarea
                rows={4}
                value={rawCodesInput}
                onChange={(e) => setRawCodesInput(e.target.value)}
                placeholder="FOX-KEY-XXXX-1111&#10;FOX-KEY-YYYY-2222&#10;FOX-KEY-ZZZZ-3333"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#191330] border border-purple-500/30 text-xs font-mono text-white placeholder-slate-500"
              />
              <button
                onClick={handleAddCodesSubmit}
                disabled={!rawCodesInput.trim()}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md"
              >
                {t.addCodesButton}
              </button>
            </div>

            {/* Current Codes List */}
            <div className="pt-3 border-t border-purple-500/20 space-y-2">
              <span className="text-xs font-bold text-slate-200 block">الأكواد المتوفرة في المخزن</span>
              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                {inventory
                  .filter((c) => c.productId === codesModalProduct.id && c.durationId === codesModalDuration.id)
                  .map((code) => (
                    <div
                      key={code.id}
                      className="p-2.5 rounded-xl bg-[#17112c] border border-purple-500/20 flex items-center justify-between text-xs font-mono"
                    >
                      <div className="flex items-center gap-2">
                        <span className={code.isSold ? 'line-through text-slate-500' : 'text-purple-300 font-bold'}>
                          {code.code}
                        </span>
                        {code.isSold ? (
                          <span className="text-[10px] text-amber-400 font-sans">
                            (تم بيعه: {code.soldToUserEmail})
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-400 font-sans">
                            (متوفر)
                          </span>
                        )}
                      </div>

                      {!code.isSold && (
                        <button
                          onClick={() => onDeleteCode(code.id)}
                          className="p-1 text-rose-400 hover:text-rose-300"
                          title={t.delete}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MANUAL BALANCE ADJUSTMENT */}
      {adjustUserModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#120d24] border border-purple-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-black text-white">{t.adjustBalance}</h3>
            <p className="text-xs text-purple-300">
              المستخدم: {adjustUserModal.email} (الرصيد الحالي: ${adjustUserModal.balance.toFixed(2)})
            </p>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustType('add')}
                  className={`py-2 rounded-xl text-xs font-bold border ${
                    adjustType === 'add'
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {t.addBalance} (+)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('deduct')}
                  className={`py-2 rounded-xl text-xs font-bold border ${
                    adjustType === 'deduct'
                      ? 'bg-rose-600 text-white border-rose-400 shadow-md'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {t.deductBalance} (-)
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">المبلغ ($)</label>
                <input
                  type="number"
                  step="0.5"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#1a1430] border border-purple-500/30 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">{t.reasonForAdjustment}</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="مثال: إيداع نقدي مباشر عبر فودافون كاش"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#1a1430] border border-purple-500/30 text-xs text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-purple-500/20">
              <button
                onClick={() => setAdjustUserModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleAdjustBalanceSubmit}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md"
              >
                تطبيق التعديل
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TOP-UP REJECTION REASON */}
      {rejectingTopUpId && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#120d24] border border-rose-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-black text-rose-300">{t.rejectRequest}</h3>
            <p className="text-xs text-slate-400">يرجى كتابة سبب الرفض ليظهر للمستخدم في حسابه.</p>

            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="مثال: لم يصل التحويل إلى المحفظة، يرجى إعادة إرسال رقم الإيصال الصحيح."
              className="w-full px-3.5 py-2 rounded-xl bg-[#1a1430] border border-rose-500/30 text-xs text-white"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setRejectingTopUpId(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleRejectSubmit}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                تأكيد الرفض
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
