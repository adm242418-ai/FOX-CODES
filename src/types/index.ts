export type UserRole = 'owner' | 'distributor' | 'customer';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  balance: number;
  createdAt: string;
  status: 'active' | 'suspended';
  language?: 'ar' | 'en';
}

export type DurationKey = '1h' | '6h' | '12h' | '1d' | '1w' | '1m' | 'custom';

export interface ProductDuration {
  id: string;
  productId: string;
  durationKey: DurationKey;
  labelAr: string;
  labelEn: string;
  customerPrice: number;
  distributorPrice: number;
  isActive: boolean;
  availableCodesCount?: number;
  soldCodesCount?: number;
}

export interface InventoryCode {
  id: string;
  productId: string;
  durationId: string;
  code: string;
  isSold: boolean;
  soldToUserId?: string;
  soldToUserEmail?: string;
  soldAt?: string;
  orderId?: string;
  isActive: boolean;
  createdAt: string;
  notes?: string;
}

export interface Category {
  id: string;
  nameAr: string;
  nameEn: string;
  icon: string;
  order: number;
}

export interface Product {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  categoryId: string;
  imageUrl: string;
  isActive: boolean;
  durations: ProductDuration[];
  createdAt: string;
}

export interface Order {
  id: string;
  userId: string;
  userEmail: string;
  userRole: UserRole;
  productId: string;
  productName: string;
  durationId: string;
  durationLabel: string;
  pricePaid: number;
  codeDelivered: string;
  createdAt: string;
  status: 'completed' | 'refunded';
}

export interface TopUpRequest {
  id: string;
  userId: string;
  userEmail: string;
  userRole: UserRole;
  amount: number;
  paymentMethod: string;
  transactionReference: string;
  receiptImageUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: 'topup' | 'purchase' | 'manual_adjustment' | 'refund';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
  adminEmail?: string;
}

export interface StoreSettings {
  storeNameAr: string;
  storeNameEn: string;
  taglineAr: string;
  taglineEn: string;
  logoUrl: string;
  bannerUrl: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  fontFamily: string;
  announcementAr: string;
  announcementEn: string;
  showAnnouncement: boolean;
  telegramHandle: string;
  telegramUrl: string;
  whatsappNumber: string;
  whatsappUrl: string;
  soundEffectsEnabled: boolean;
  soundVolume: number;
  privacyPolicyAr: string;
  termsAr: string;
}

export interface AdminAuditLog {
  id: string;
  adminEmail: string;
  action: string;
  details: string;
  targetId?: string;
  createdAt: string;
}
