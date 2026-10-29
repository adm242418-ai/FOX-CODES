import {
  Category,
  InventoryCode,
  Order,
  Product,
  StoreSettings,
  TopUpRequest,
  UserProfile,
  WalletTransaction,
  UserRole,
  ProductDuration
} from '../types';
import { executePurchaseLogic, approveTopUpLogic, OWNER_EMAIL } from '../utils/storeLogic';
import { supabase, isSupabaseConfigured } from './supabase';

const STORAGE_KEYS = {
  SETTINGS: 'fox_codes_settings_v1',
  PRODUCTS: 'fox_codes_products_v1',
  CATEGORIES: 'fox_codes_categories_v1',
  INVENTORY: 'fox_codes_inventory_v1',
  ORDERS: 'fox_codes_orders_v1',
  USERS: 'fox_codes_users_v1',
  TOPUPS: 'fox_codes_topups_v1',
  TRANSACTIONS: 'fox_codes_txs_v1',
  CURRENT_USER: 'fox_codes_current_user_v1',
  THEME_MODE: 'fox_codes_theme_mode_v1',
  LANG: 'fox_codes_lang_v1',
};

export const DEFAULT_SETTINGS: StoreSettings = {
  storeNameAr: 'FOX CODES',
  storeNameEn: 'FOX CODES',
  taglineAr: 'المتجر الرقمي الفاخر للأكواد والتفعيلات الفورية',
  taglineEn: 'Luxury Digital Store for Instant Codes & Licenses',
  logoUrl: '',
  bannerUrl: '',
  primaryColor: '#a855f7',
  secondaryColor: '#c084fc',
  backgroundColor: '#08070d',
  fontFamily: "'Cairo', sans-serif",
  announcementAr: '⚡ مرحبًا بكم في FOX CODES — شحن فوري وتسليم مباشر للأكواد على مدار الساعة!',
  announcementEn: '⚡ Welcome to FOX CODES — Instant delivery for digital codes 24/7!',
  showAnnouncement: true,
  telegramHandle: '@FOX_VIP_7',
  telegramUrl: 'https://t.me/FOX_VIP_7',
  whatsappNumber: '01094007239',
  whatsappUrl: 'https://wa.me/201094007239',
  soundEffectsEnabled: true,
  soundVolume: 0.4,
  privacyPolicyAr: 'نلتزم في FOX CODES بحماية بياناتكم وتقديم أعلى درجات الأمان في استلام الأكواد.',
  termsAr: 'جميع المنتجات والأكواد الرقمية المباعة أصلية وتعمل بكفاءة فور التسليم.'
};

class StoreService {
  private settings: StoreSettings = DEFAULT_SETTINGS;
  private categories: Category[] = [];
  private products: Product[] = [];
  private inventory: InventoryCode[] = [];
  private orders: Order[] = [];
  private users: UserProfile[] = [];
  private topUps: TopUpRequest[] = [];
  private transactions: WalletTransaction[] = [];
  private currentUser: UserProfile | null = null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (storedSettings) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(storedSettings) };
      }

      const storedCategories = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (storedCategories) {
        this.categories = JSON.parse(storedCategories);
      }

      const storedProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (storedProducts) {
        this.products = JSON.parse(storedProducts);
      }

      const storedInventory = localStorage.getItem(STORAGE_KEYS.INVENTORY);
      if (storedInventory) {
        this.inventory = JSON.parse(storedInventory);
      }

      const storedOrders = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (storedOrders) {
        this.orders = JSON.parse(storedOrders);
      }

      const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      if (storedUsers) {
        this.users = JSON.parse(storedUsers);
      }

      const storedTopups = localStorage.getItem(STORAGE_KEYS.TOPUPS);
      if (storedTopups) {
        this.topUps = JSON.parse(storedTopups);
      }

      const storedTxs = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (storedTxs) {
        this.transactions = JSON.parse(storedTxs);
      }

      const storedCurrent = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (storedCurrent) {
        const parsed = JSON.parse(storedCurrent);
        // Sync with users array to ensure balance/role updates stay fresh
        const match = this.users.find(u => u.id === parsed.id);
        this.currentUser = match || parsed;
      }
    } catch (e) {
      console.warn('Could not load from localStorage:', e);
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  // --- Getters ---
  public getSettings(): StoreSettings {
    return { ...this.settings };
  }

  public getCategories(): Category[] {
    return [...this.categories];
  }

  public getProducts(): Product[] {
    return [...this.products];
  }

  public getInventory(): InventoryCode[] {
    return [...this.inventory];
  }

  public getOrders(): Order[] {
    return [...this.orders];
  }

  public getUsers(): UserProfile[] {
    return [...this.users];
  }

  public getTopUps(): TopUpRequest[] {
    return [...this.topUps];
  }

  public getTransactions(): WalletTransaction[] {
    return [...this.transactions];
  }

  public getCurrentUser(): UserProfile | null {
    return this.currentUser ? { ...this.currentUser } : null;
  }

  // --- Settings Customization (Owner Only) ---
  public updateSettings(newSettings: Partial<StoreSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
    this.notify();
  }

  public resetSettings() {
    this.settings = { ...DEFAULT_SETTINGS };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
    this.notify();
  }

  // --- Auth & Users ---
  public setCurrentUser(user: UserProfile | null) {
    this.currentUser = user;
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
    this.notify();
  }

  public registerUser(email: string, displayName: string): UserProfile {
    const isOwner = email.trim().toLowerCase() === OWNER_EMAIL.toLowerCase();
    const existing = this.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (existing) {
      this.setCurrentUser(existing);
      return existing;
    }

    const newUser: UserProfile = {
      id: 'USR-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      email: email.trim().toLowerCase(),
      displayName: displayName.trim() || email.split('@')[0],
      role: isOwner ? 'owner' : 'customer',
      balance: 0.0,
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    this.users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(this.users));
    this.setCurrentUser(newUser);
    return newUser;
  }

  public updateUserRole(userId: string, newRole: UserRole) {
    const user = this.users.find(u => u.id === userId);
    if (!user) return;
    
    // Prevent modifying owner role
    if (user.email.toLowerCase() === OWNER_EMAIL.toLowerCase()) {
      user.role = 'owner';
    } else {
      user.role = newRole;
    }

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(this.users));
    if (this.currentUser && this.currentUser.id === userId) {
      this.currentUser = { ...user };
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(this.currentUser));
    }
    this.notify();
  }

  public manualAdjustBalance(userId: string, amount: number, reason: string, adminEmail: string) {
    const user = this.users.find(u => u.id === userId);
    if (!user) return;

    const before = user.balance;
    const after = Math.max(0, Number((user.balance + amount).toFixed(2)));
    user.balance = after;

    const tx: WalletTransaction = {
      id: 'TX-ADJ-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      userId,
      type: 'manual_adjustment',
      amount,
      balanceBefore: before,
      balanceAfter: after,
      description: `تعديل يدوي: ${reason}`,
      adminEmail,
      createdAt: new Date().toISOString()
    };

    this.transactions.unshift(tx);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(this.users));
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(this.transactions));

    if (this.currentUser && this.currentUser.id === userId) {
      this.currentUser = { ...user };
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(this.currentUser));
    }
    this.notify();
  }

  // --- Category Management ---
  public addCategory(nameAr: string, nameEn: string, icon: string = 'Sparkles'): Category {
    const cat: Category = {
      id: 'CAT-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
      nameAr,
      nameEn,
      icon,
      order: this.categories.length + 1
    };
    this.categories.push(cat);
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(this.categories));
    this.notify();
    return cat;
  }

  public deleteCategory(id: string) {
    this.categories = this.categories.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(this.categories));
    this.notify();
  }

  // --- Product Management ---
  public saveProduct(product: Product) {
    const idx = this.products.findIndex(p => p.id === product.id);
    if (idx >= 0) {
      this.products[idx] = product;
    } else {
      this.products.unshift(product);
    }
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(this.products));
    this.notify();
  }

  public deleteProduct(id: string) {
    this.products = this.products.filter(p => p.id !== id);
    this.inventory = this.inventory.filter(c => c.productId !== id);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(this.products));
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(this.inventory));
    this.notify();
  }

  // --- Inventory & Codes Management ---
  public addCodes(productId: string, durationId: string, rawCodesText: string): number {
    const lines = rawCodesText
      .split(/[\r\n]+|\\n/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const now = new Date().toISOString();
    const newItems: InventoryCode[] = lines.map(codeStr => ({
      id: 'COD-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      productId,
      durationId,
      code: codeStr,
      isSold: false,
      isActive: true,
      createdAt: now
    }));

    this.inventory.push(...newItems);
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(this.inventory));
    this.notify();
    return newItems.length;
  }

  public deleteCode(codeId: string) {
    this.inventory = this.inventory.filter(c => c.id !== codeId);
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(this.inventory));
    this.notify();
  }

  public toggleCodeStatus(codeId: string) {
    const code = this.inventory.find(c => c.id === codeId);
    if (code) {
      code.isActive = !code.isActive;
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(this.inventory));
      this.notify();
    }
  }

  // --- Atomic Purchase ---
  public purchaseProduct(params: {
    productId: string;
    durationId: string;
    user: UserProfile;
  }): { success: boolean; error?: string; order?: Order; code?: string } {
    const product = this.products.find(p => p.id === params.productId && p.isActive);
    if (!product) {
      return { success: false, error: 'المنتج غير متاح حاليًا' };
    }

    const duration = product.durations.find(d => d.id === params.durationId && d.isActive);
    if (!duration) {
      return { success: false, error: 'هذه المدة غير مفعلة' };
    }

    // Determine price by role
    const price = params.user.role === 'distributor' ? duration.distributorPrice : duration.customerPrice;

    // Check balance
    if (params.user.balance < price) {
      return { success: false, error: 'رصيدك غير كافٍ. يُرجى شحن المحفظة أولاً.' };
    }

    // Find available unsold active code
    const codeObj = this.inventory.find(
      c => c.productId === product.id && c.durationId === duration.id && !c.isSold && c.isActive
    );

    if (!codeObj) {
      return { success: false, error: 'عذرًا، هذه المدة غير متوفرة حاليًا' };
    }

    // Atomic execution
    const result = executePurchaseLogic({
      user: params.user,
      productName: product.nameAr,
      duration,
      price,
      code: codeObj
    });

    // Update in-memory state & persist
    // 1. User
    const userIdx = this.users.findIndex(u => u.id === params.user.id);
    if (userIdx >= 0) {
      this.users[userIdx] = result.updatedUser;
    }
    this.currentUser = result.updatedUser;

    // 2. Code
    const codeIdx = this.inventory.findIndex(c => c.id === codeObj.id);
    if (codeIdx >= 0) {
      this.inventory[codeIdx] = result.updatedCode;
    }

    // 3. Order
    this.orders.unshift(result.order);

    // 4. Transaction
    this.transactions.unshift(result.transaction);

    // Save all to localStorage
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(this.users));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(this.currentUser));
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(this.inventory));
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(this.orders));
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(this.transactions));

    this.notify();

    return {
      success: true,
      order: result.order,
      code: result.updatedCode.code
    };
  }

  // --- Top-up Requests ---
  public submitTopUpRequest(params: {
    userId: string;
    userEmail: string;
    userRole: UserRole;
    amount: number;
    paymentMethod: string;
    transactionReference: string;
    receiptImageUrl?: string;
  }): TopUpRequest {
    const req: TopUpRequest = {
      id: 'TOP-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      userId: params.userId,
      userEmail: params.userEmail,
      userRole: params.userRole,
      amount: params.amount,
      paymentMethod: params.paymentMethod,
      transactionReference: params.transactionReference,
      receiptImageUrl: params.receiptImageUrl,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    this.topUps.unshift(req);
    localStorage.setItem(STORAGE_KEYS.TOPUPS, JSON.stringify(this.topUps));
    this.notify();
    return req;
  }

  public approveTopUp(requestId: string, adminEmail: string): boolean {
    const req = this.topUps.find(r => r.id === requestId);
    if (!req || req.status !== 'pending') return false;

    const user = this.users.find(u => u.id === req.userId);
    if (!user) return false;

    const result = approveTopUpLogic({
      user,
      amount: req.amount,
      adminEmail
    });

    req.status = 'approved';
    req.reviewedBy = adminEmail;
    req.reviewedAt = new Date().toISOString();

    const userIdx = this.users.findIndex(u => u.id === req.userId);
    if (userIdx >= 0) {
      this.users[userIdx] = result.updatedUser;
    }
    if (this.currentUser && this.currentUser.id === req.userId) {
      this.currentUser = result.updatedUser;
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(this.currentUser));
    }

    this.transactions.unshift(result.transaction);

    localStorage.setItem(STORAGE_KEYS.TOPUPS, JSON.stringify(this.topUps));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(this.users));
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(this.transactions));

    this.notify();
    return true;
  }

  public rejectTopUp(requestId: string, reason: string, adminEmail: string): boolean {
    const req = this.topUps.find(r => r.id === requestId);
    if (!req || req.status !== 'pending') return false;

    req.status = 'rejected';
    req.rejectionReason = reason;
    req.reviewedBy = adminEmail;
    req.reviewedAt = new Date().toISOString();

    localStorage.setItem(STORAGE_KEYS.TOPUPS, JSON.stringify(this.topUps));
    this.notify();
    return true;
  }
}

export const storeService = new StoreService();
