import test from 'node:test';
import assert from 'node:assert/strict';
import {
  determineUserPrice,
  checkDurationAvailability,
  validatePurchase,
  executePurchaseLogic,
  approveTopUpLogic
} from './storeLogic';
import { InventoryCode, ProductDuration, UserProfile } from '../types';

test('determineUserPrice provides distributor price to distributors and customer price to customers', () => {
  const duration: ProductDuration = {
    id: 'd1',
    productId: 'p1',
    durationKey: '1d',
    labelAr: 'يوم واحد',
    labelEn: '1 Day',
    customerPrice: 15,
    distributorPrice: 10,
    isActive: true
  };

  assert.equal(determineUserPrice(duration, 'customer'), 15);
  assert.equal(determineUserPrice(duration, 'distributor'), 10);
});

test('checkDurationAvailability correctly calculates real unsold codes and marks out of stock when 0', () => {
  const duration: ProductDuration = {
    id: 'd1',
    productId: 'p1',
    durationKey: '1d',
    labelAr: 'يوم واحد',
    labelEn: '1 Day',
    customerPrice: 15,
    distributorPrice: 10,
    isActive: true
  };

  const codes: InventoryCode[] = [
    {
      id: 'c1',
      productId: 'p1',
      durationId: 'd1',
      code: 'FOX-CODE-1111',
      isSold: false,
      isActive: true,
      createdAt: '2026-01-01'
    },
    {
      id: 'c2',
      productId: 'p1',
      durationId: 'd1',
      code: 'FOX-CODE-2222',
      isSold: true,
      isActive: true,
      createdAt: '2026-01-01'
    }
  ];

  const resultWithStock = checkDurationAvailability(duration, codes);
  assert.equal(resultWithStock.isAvailable, true);
  assert.equal(resultWithStock.availableCount, 1);
  assert.equal(resultWithStock.soldCount, 1);

  // If no unsold codes remain
  const soldOutCodes: InventoryCode[] = [
    {
      id: 'c2',
      productId: 'p1',
      durationId: 'd1',
      code: 'FOX-CODE-2222',
      isSold: true,
      isActive: true,
      createdAt: '2026-01-01'
    }
  ];
  const resultSoldOut = checkDurationAvailability(duration, soldOutCodes);
  assert.equal(resultSoldOut.isAvailable, false);
  assert.equal(resultSoldOut.availableCount, 0);
  assert.equal(resultSoldOut.messageKey, 'stockUnavailableMsg');
});

test('validatePurchase prevents purchase if balance is insufficient or if duration has no code', () => {
  const code: InventoryCode = {
    id: 'c1',
    productId: 'p1',
    durationId: 'd1',
    code: 'FOX-TEST-1234',
    isSold: false,
    isActive: true,
    createdAt: '2026-01-01'
  };

  // Case 1: Insufficient funds
  const failBalance = validatePurchase({
    userBalance: 5,
    price: 15,
    durationIsActive: true,
    availableCode: code
  });
  assert.equal(failBalance.canPurchase, false);
  assert.equal(failBalance.errorCode, 'insufficientBalance');

  // Case 2: Code already sold
  const soldCode = { ...code, isSold: true };
  const failCode = validatePurchase({
    userBalance: 20,
    price: 15,
    durationIsActive: true,
    availableCode: soldCode
  });
  assert.equal(failCode.canPurchase, false);
  assert.equal(failCode.errorCode, 'noCodesAvailable');

  // Case 3: Success
  const ok = validatePurchase({
    userBalance: 20,
    price: 15,
    durationIsActive: true,
    availableCode: code
  });
  assert.equal(ok.canPurchase, true);
});

test('executePurchaseLogic deducts balance atomically and assigns code once', () => {
  const user: UserProfile = {
    id: 'u1',
    email: 'client@example.com',
    displayName: 'Client One',
    role: 'customer',
    balance: 50.0,
    createdAt: '2026-01-01',
    status: 'active'
  };

  const duration: ProductDuration = {
    id: 'd1',
    productId: 'p1',
    durationKey: '1m',
    labelAr: 'شهر كامل',
    labelEn: '1 Month',
    customerPrice: 30,
    distributorPrice: 20,
    isActive: true
  };

  const code: InventoryCode = {
    id: 'c1',
    productId: 'p1',
    durationId: 'd1',
    code: 'FOX-VIP-PASS-999',
    isSold: false,
    isActive: true,
    createdAt: '2026-01-01'
  };

  const outcome = executePurchaseLogic({
    user,
    productName: 'PUBG VIP Key',
    duration,
    price: 30,
    code
  });

  assert.equal(outcome.updatedUser.balance, 20.0);
  assert.equal(outcome.updatedCode.isSold, true);
  assert.equal(outcome.updatedCode.soldToUserId, 'u1');
  assert.equal(outcome.order.codeDelivered, 'FOX-VIP-PASS-999');
  assert.equal(outcome.order.pricePaid, 30);
  assert.equal(outcome.transaction.amount, -30);
  assert.equal(outcome.transaction.balanceBefore, 50.0);
  assert.equal(outcome.transaction.balanceAfter, 20.0);
});

test('approveTopUpLogic credits user balance accurately with transaction log', () => {
  const user: UserProfile = {
    id: 'u2',
    email: 'distributor@example.com',
    displayName: 'Wholesale Partner',
    role: 'distributor',
    balance: 100.0,
    createdAt: '2026-01-01',
    status: 'active'
  };

  const res = approveTopUpLogic({
    user,
    amount: 250.0,
    adminEmail: '389330adamahmedamr@gmail.com'
  });

  assert.equal(res.updatedUser.balance, 350.0);
  assert.equal(res.transaction.amount, 250.0);
  assert.equal(res.transaction.balanceBefore, 100.0);
  assert.equal(res.transaction.balanceAfter, 350.0);
  assert.equal(res.transaction.adminEmail, '389330adamahmedamr@gmail.com');
});
