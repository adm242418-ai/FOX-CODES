import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar, ActiveSection } from './components/Sidebar';
import { CustomerStore } from './components/CustomerStore';
import { DistributorStore } from './components/DistributorStore';
import { OwnerDashboard } from './components/OwnerDashboard';
import { TopUpModal } from './components/TopUpModal';
import { AuthModal } from './components/AuthModal';
import { PurchaseSuccessModal } from './components/PurchaseSuccessModal';
import { OrdersModal } from './components/OrdersModal';
import { Footer } from './components/Footer';
import { storeService } from './services/storeService';
import {
  Category,
  InventoryCode,
  Order,
  Product,
  StoreSettings,
  TopUpRequest,
  UserProfile,
  UserRole
} from './types';
import { MaintenanceScreen } from './components/MaintenanceScreen';
import { subscribeToMaintenanceMode, updateFirebaseMaintenanceMode, MaintenanceStatus } from './services/firebase';
import { OWNER_EMAIL } from './utils/storeLogic';
import { Crown, Store, User } from 'lucide-react';
import { Language } from './utils/i18n';
import { soundManager } from './utils/sound';

export default function App() {
  // Store dynamic state
  const [settings, setSettings] = useState<StoreSettings>(storeService.getSettings());
  const [categories, setCategories] = useState<Category[]>(storeService.getCategories());
  const [products, setProducts] = useState<Product[]>(storeService.getProducts());
  const [inventory, setInventory] = useState<InventoryCode[]>(storeService.getInventory());
  const [orders, setOrders] = useState<Order[]>(storeService.getOrders());
  const [users, setUsers] = useState<UserProfile[]>(storeService.getUsers());
  const [topUps, setTopUps] = useState<TopUpRequest[]>(storeService.getTopUps());
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(storeService.getCurrentUser());

  // Navigation & UI state
  const [activeSection, setActiveSection] = useState<ActiveSection>('customer');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('fox_codes_lang') as Language) || 'ar';
  });
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem('fox_codes_theme') !== 'light';
  });

  // Modals state
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [successOrder, setSuccessOrder] = useState<{ order: Order; code: string } | null>(null);

  // Firebase Maintenance Mode state
  const [maintenanceStatus, setMaintenanceStatus] = useState<MaintenanceStatus>({
    isMaintenance: false,
    message: "Sorry, we're currently performing maintenance. Please try again later."
  });

  // Subscribe to Firebase Maintenance Mode
  useEffect(() => {
    const unsub = subscribeToMaintenanceMode((status) => {
      setMaintenanceStatus(status);
    });
    return () => unsub();
  }, []);

  const handleToggleMaintenance = async (enable: boolean) => {
    const email = currentUser?.email || OWNER_EMAIL;
    await updateFirebaseMaintenanceMode(
      enable,
      email,
      "Sorry, we're currently performing maintenance. Please try again later."
    );
  };

  const isOwnerUser = currentUser?.role === 'owner' || currentUser?.email.toLowerCase() === OWNER_EMAIL.toLowerCase();

  // Subscribe to storeService updates
  useEffect(() => {
    const unsubscribe = storeService.subscribe(() => {
      setSettings(storeService.getSettings());
      setCategories(storeService.getCategories());
      setProducts(storeService.getProducts());
      setInventory(storeService.getInventory());
      setOrders(storeService.getOrders());
      setUsers(storeService.getUsers());
      setTopUps(storeService.getTopUps());
      setCurrentUser(storeService.getCurrentUser());
    });
    return () => unsubscribe();
  }, []);

  // Update HTML dir and lang
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('fox_codes_lang', lang);
  }, [lang]);

  // Update theme class
  useEffect(() => {
    localStorage.setItem('fox_codes_theme', isDark ? 'dark' : 'light');
    if (!isDark) {
      document.documentElement.classList.add('theme-light');
    } else {
      document.documentElement.classList.remove('theme-light');
    }
  }, [isDark]);

  // Handlers
  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    soundManager.playClick();
  };

  const handleThemeToggle = () => {
    setIsDark(!isDark);
  };

  const handleLogin = (email: string, displayName?: string) => {
    const user = storeService.registerUser(email, displayName || '');
    setCurrentUser(user);
    return user;
  };

  const handleLogout = () => {
    storeService.setCurrentUser(null);
    setCurrentUser(null);
  };

  const handlePurchase = (productId: string, durationId: string) => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }

    const res = storeService.purchaseProduct({
      productId,
      durationId,
      user: currentUser
    });

    if (res.success && res.order && res.code) {
      soundManager.playSuccess();
      setSuccessOrder({ order: res.order, code: res.code });
    } else {
      soundManager.playError();
      alert(res.error || 'عذرًا، تعذر إتمام عملية الشراء');
    }
  };

  const handleTopUpSubmit = (params: {
    amount: number;
    paymentMethod: string;
    transactionReference: string;
    receiptImageUrl?: string;
  }) => {
    if (!currentUser) return;
    storeService.submitTopUpRequest({
      userId: currentUser.id,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      ...params
    });
  };

  // If maintenance mode is active in Firebase and user is not verified Owner, render MaintenanceScreen!
  if (maintenanceStatus.isMaintenance && !isOwnerUser) {
    return (
      <>
        <MaintenanceScreen
          settings={settings}
          message={maintenanceStatus.message}
          user={currentUser}
          onOpenOwnerAuth={() => setIsAuthOpen(true)}
          onDisableMaintenance={() => handleToggleMaintenance(false)}
        />
        {isAuthOpen && (
          <AuthModal
            lang={lang}
            onClose={() => setIsAuthOpen(false)}
            onLogin={handleLogin}
          />
        )}
      </>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-300 ${
        isDark ? 'bg-[#08070d] text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
      style={{
        fontFamily: settings.fontFamily || "'Cairo', sans-serif"
      }}
    >
      {/* Top Header */}
      <Header
        settings={settings}
        user={currentUser}
        lang={lang}
        isDark={isDark}
        onLanguageChange={handleLanguageChange}
        onThemeToggle={handleThemeToggle}
        onOpenTopUp={() => setIsTopUpOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        onOpenOrders={() => setIsOrdersOpen(true)}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Main Body with Left Vertical Sidebar on Desktop & Wide Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Mobile & Tablet Role Bar (Shown under 1024px to prevent content cramping) */}
        <div className="grid grid-cols-3 gap-2 mb-4 lg:hidden">
          <button
            onClick={() => {
              soundManager.playClick();
              setActiveSection('owner');
            }}
            className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1 border transition-all ${
              activeSection === 'owner'
                ? 'bg-purple-900/60 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.35)]'
                : 'bg-[#120d22]/50 border-purple-500/20 text-slate-300'
            }`}
          >
            <Crown className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-bold">{lang === 'ar' ? 'الملك' : 'Owner'}</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              setActiveSection('distributor');
            }}
            className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1 border transition-all ${
              activeSection === 'distributor'
                ? 'bg-purple-900/60 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.35)]'
                : 'bg-[#120d22]/50 border-purple-500/20 text-slate-300'
            }`}
          >
            <Store className="w-5 h-5 text-fuchsia-400" />
            <span className="text-xs font-bold">{lang === 'ar' ? 'الموزع' : 'Distributor'}</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              setActiveSection('customer');
            }}
            className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1 border transition-all ${
              activeSection === 'customer'
                ? 'bg-purple-900/60 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.35)]'
                : 'bg-[#120d22]/50 border-purple-500/20 text-slate-300'
            }`}
          >
            <User className="w-5 h-5 text-purple-400" />
            <span className="text-xs font-bold">{lang === 'ar' ? 'العميل' : 'Customer'}</span>
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Main Content Area on Right in Arabic RTL */}
          <main className="flex-1 w-full min-w-0">
            {activeSection === 'customer' && (
              <CustomerStore
                products={products}
                categories={categories}
                inventory={inventory}
                user={currentUser}
                settings={settings}
                lang={lang}
                onPurchase={handlePurchase}
                onOpenTopUp={() => setIsTopUpOpen(true)}
                onOpenAuth={() => setIsAuthOpen(true)}
                onNavigateToOwner={() => setActiveSection('owner')}
              />
            )}

            {activeSection === 'distributor' && (
              <DistributorStore
                products={products}
                categories={categories}
                inventory={inventory}
                user={currentUser}
                settings={settings}
                lang={lang}
                onPurchase={handlePurchase}
                onOpenTopUp={() => setIsTopUpOpen(true)}
                onOpenAuth={() => setIsAuthOpen(true)}
              />
            )}

            {activeSection === 'owner' && (
              <OwnerDashboard
                user={currentUser}
                settings={settings}
                products={products}
                categories={categories}
                inventory={inventory}
                users={users}
                topUps={topUps}
                orders={orders}
                lang={lang}
                onUpdateSettings={(newSet) => storeService.updateSettings(newSet)}
                onResetSettings={() => storeService.resetSettings()}
                onSaveProduct={(prod) => storeService.saveProduct(prod)}
                onDeleteProduct={(id) => storeService.deleteProduct(id)}
                onAddCodes={(pId, dId, text) => storeService.addCodes(pId, dId, text)}
                onDeleteCode={(codeId) => storeService.deleteCode(codeId)}
                onToggleCode={(codeId) => storeService.toggleCodeStatus(codeId)}
                onUpdateUserRole={(uId, role) => storeService.updateUserRole(uId, role)}
                onAdjustBalance={(uId, amt, rsn) =>
                  storeService.manualAdjustBalance(uId, amt, rsn, currentUser?.email || 'admin')
                }
                onApproveTopUp={(reqId) =>
                  storeService.approveTopUp(reqId, currentUser?.email || '389330adamahmedamr@gmail.com')
                }
                onRejectTopUp={(reqId, rsn) =>
                  storeService.rejectTopUp(reqId, rsn, currentUser?.email || '389330adamahmedamr@gmail.com')
                }
                onOpenAuth={() => setIsAuthOpen(true)}
                isMaintenance={maintenanceStatus.isMaintenance}
                onToggleMaintenance={handleToggleMaintenance}
              />
            )}
          </main>

          {/* Vertical Sidebar on Left (Arabic RTL) */}
          <Sidebar
            activeSection={activeSection}
            onSelectSection={setActiveSection}
            lang={lang}
            settings={settings}
            user={currentUser}
            mobileMenuOpen={mobileMenuOpen}
            onCloseMobileMenu={() => setMobileMenuOpen(false)}
          />
        </div>
      </div>

      {/* Footer */}
      <Footer settings={settings} lang={lang} />

      {/* Modals */}
      {isTopUpOpen && (
        <TopUpModal
          user={currentUser}
          settings={settings}
          lang={lang}
          onClose={() => setIsTopUpOpen(false)}
          onSubmit={handleTopUpSubmit}
          onOpenAuth={() => {
            setIsTopUpOpen(false);
            setIsAuthOpen(true);
          }}
        />
      )}

      {isAuthOpen && (
        <AuthModal
          lang={lang}
          onClose={() => setIsAuthOpen(false)}
          onLogin={handleLogin}
        />
      )}

      {successOrder && (
        <PurchaseSuccessModal
          order={successOrder.order}
          code={successOrder.code}
          lang={lang}
          onClose={() => setSuccessOrder(null)}
          onViewOrders={() => {
            setSuccessOrder(null);
            setIsOrdersOpen(true);
          }}
        />
      )}

      {isOrdersOpen && (
        <OrdersModal
          orders={
            currentUser?.role === 'owner'
              ? orders
              : orders.filter((o) => o.userId === currentUser?.id)
          }
          lang={lang}
          onClose={() => setIsOrdersOpen(false)}
        />
      )}
    </div>
  );
}
