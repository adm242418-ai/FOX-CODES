import { InventoryCode, Order, ProductDuration, UserProfile, UserRole, WalletTransaction } from '../types';

export const OWNER_EMAIL = '389330adamahmedamr@gmail.com';

/**
 * Determines product price based on user role.
 * Distributors receive wholesale distributorPrice. Customers receive customerPrice.
 */
export function determineUserPrice(duration: ProductDuration, role: UserRole): number {
  if (role === 'distributor') {
    return duration.distributorPrice;
  }
  return duration.customerPrice;
}

/**
 * Checks whether a given duration has active unsold codes in stock.
 */
export function checkDurationAvailability(duration: ProductDuration, codes: InventoryCode[]): {
  isAvailable: boolean;
  availableCount: number;
  soldCount: number;
  messageKey: string;
} {
  if (!duration.isActive) {
    return {
      isAvailable: false,
      availableCount: 0,
      soldCount: 0,
      messageKey: 'stockUnavailableMsg'
    };
  }

  const matchingCodes = codes.filter(c => c.durationId === duration.id);
  const availableCodes = matchingCodes.filter(c => !c.isSold && c.isActive);
  const soldCodes = matchingCodes.filter(c => c.isSold);

  const isAvailable = availableCodes.length > 0;

  return {
    isAvailable,
    availableCount: availableCodes.length,
    soldCount: soldCodes.length,
    messageKey: isAvailable ? 'available' : 'stockUnavailableMsg'
  };
}

/**
 * Validates purchase conditions:
 * 1. Duration must be active & available.
 * 2. Unsold code must exist.
 * 3. User balance must be sufficient.
 */
export function validatePurchase(params: {
  userBalance: number;
  price: number;
  durationIsActive: boolean;
  availableCode?: InventoryCode | null;
}): { canPurchase: boolean; errorCode?: string } {
  const { userBalance, price, durationIsActive, availableCode } = params;

  if (!durationIsActive) {
    return { canPurchase: false, errorCode: 'stockUnavailableMsg' };
  }

  if (!availableCode || availableCode.isSold || !availableCode.isActive) {
    return { canPurchase: false, errorCode: 'noCodesAvailable' };
  }

  if (userBalance < price) {
    return { canPurchase: false, errorCode: 'insufficientBalance' };
  }

  return { canPurchase: true };
}

/**
 * Atomically executes a purchase:
 * - Deducts balance safely
 * - Marks the single specific code as sold to prevent double delivery
 * - Produces an immutable Order record
 * - Produces a WalletTransaction record
 */
export function executePurchaseLogic(params: {
  user: UserProfile;
  productName: string;
  duration: ProductDuration;
  price: number;
  code: InventoryCode;
}): {
  updatedUser: UserProfile;
  updatedCode: InventoryCode;
  order: Order;
  transaction: WalletTransaction;
} {
  const { user, productName, duration, price, code } = params;

  const orderId = 'ORD-' + Math.random().toString(36).substring(2, 9).toUpperCase();
  const txId = 'TX-' + Math.random().toString(36).substring(2, 9).toUpperCase();
  const now = new Date().toISOString();

  const newBalance = Number((user.balance - price).toFixed(2));

  const updatedUser: UserProfile = {
    ...user,
    balance: newBalance
  };

  const updatedCode: InventoryCode = {
    ...code,
    isSold: true,
    soldToUserId: user.id,
    soldToUserEmail: user.email,
    soldAt: now,
    orderId
  };

  const order: Order = {
    id: orderId,
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    productId: duration.productId,
    productName,
    durationId: duration.id,
    durationLabel: duration.labelAr,
    pricePaid: price,
    codeDelivered: code.code,
    createdAt: now,
    status: 'completed'
  };

  const transaction: WalletTransaction = {
    id: txId,
    userId: user.id,
    type: 'purchase',
    amount: -price,
    balanceBefore: user.balance,
    balanceAfter: newBalance,
    description: `شراء ${productName} (${duration.labelAr})`,
    createdAt: now
  };

  return {
    updatedUser,
    updatedCode,
    order,
    transaction
  };
}

/**
 * Approves a top-up request and generates updated user profile and transaction
 */
export function approveTopUpLogic(params: {
  user: UserProfile;
  amount: number;
  adminEmail: string;
}): {
  updatedUser: UserProfile;
  transaction: WalletTransaction;
} {
  const { user, amount, adminEmail } = params;
  const now = new Date().toISOString();
  const newBalance = Number((user.balance + amount).toFixed(2));
  const txId = 'TX-TOPUP-' + Math.random().toString(36).substring(2, 9).toUpperCase();

  const updatedUser: UserProfile = {
    ...user,
    balance: newBalance
  };

  const transaction: WalletTransaction = {
    id: txId,
    userId: user.id,
    type: 'topup',
    amount,
    balanceBefore: user.balance,
    balanceAfter: newBalance,
    description: `شحن رصيد معتمد بقيمة $${amount}`,
    adminEmail,
    createdAt: now
  };

  return { updatedUser, transaction };
}
