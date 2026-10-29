-- ==============================================================================
-- FOX CODES — SUPABASE PRODUCTION DATABASE SCHEMA & SECURITY POLICIES (RLS)
-- ==============================================================================

-- 1. Create custom types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('owner', 'distributor', 'customer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Profiles Table (Linked with Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'customer',
    balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    language TEXT NOT NULL DEFAULT 'ar' CHECK (language IN ('ar', 'en')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'Sparkles',
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    description_ar TEXT NOT NULL,
    description_en TEXT NOT NULL,
    category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
    image_url TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Product Durations Table
CREATE TABLE IF NOT EXISTS public.product_durations (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    duration_key TEXT NOT NULL,
    label_ar TEXT NOT NULL,
    label_en TEXT NOT NULL,
    customer_price NUMERIC(10, 2) NOT NULL CHECK (customer_price >= 0),
    distributor_price NUMERIC(10, 2) NOT NULL CHECK (distributor_price >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Inventory Codes Table
CREATE TABLE IF NOT EXISTS public.inventory_codes (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    duration_id TEXT NOT NULL REFERENCES public.product_durations(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    is_sold BOOLEAN NOT NULL DEFAULT false,
    sold_to_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    sold_to_user_email TEXT,
    sold_at TIMESTAMPTZ,
    order_id TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    user_role user_role NOT NULL,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    duration_id TEXT NOT NULL,
    duration_label TEXT NOT NULL,
    price_paid NUMERIC(10, 2) NOT NULL,
    code_delivered TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. Top-up / Deposit Requests Table
CREATE TABLE IF NOT EXISTS public.topup_requests (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    user_role user_role NOT NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    payment_method TEXT NOT NULL,
    transaction_reference TEXT NOT NULL,
    receipt_image_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    reviewed_by TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. Wallet Transactions Table
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('topup', 'purchase', 'manual_adjustment', 'refund')),
    amount NUMERIC(10, 2) NOT NULL,
    balance_before NUMERIC(12, 2) NOT NULL,
    balance_after NUMERIC(12, 2) NOT NULL,
    description TEXT NOT NULL,
    admin_email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. Store Settings Table
CREATE TABLE IF NOT EXISTS public.store_settings (
    id TEXT PRIMARY KEY DEFAULT 'current',
    store_name_ar TEXT NOT NULL DEFAULT 'FOX CODES',
    store_name_en TEXT NOT NULL DEFAULT 'FOX CODES',
    tagline_ar TEXT NOT NULL DEFAULT 'المتجر الرقمي الفاخر للأكواد والتفعيلات الفورية',
    tagline_en TEXT NOT NULL DEFAULT 'Luxury Digital Store for Instant Codes & Licenses',
    logo_url TEXT NOT NULL DEFAULT '',
    banner_url TEXT NOT NULL DEFAULT '',
    primary_color TEXT NOT NULL DEFAULT '#a855f7',
    secondary_color TEXT NOT NULL DEFAULT '#ec4899',
    background_color TEXT NOT NULL DEFAULT '#08070d',
    font_family TEXT NOT NULL DEFAULT '''Cairo'', sans-serif',
    announcement_ar TEXT NOT NULL DEFAULT 'أهلاً بكم في FOX CODES — شحن فوري وتسليم مباشر للأكواد على مدار الساعة!',
    announcement_en TEXT NOT NULL DEFAULT 'Welcome to FOX CODES — Instant delivery for digital codes 24/7!',
    show_announcement BOOLEAN NOT NULL DEFAULT true,
    telegram_handle TEXT NOT NULL DEFAULT '@FOX_VIP_7',
    telegram_url TEXT NOT NULL DEFAULT 'https://t.me/FOX_VIP_7',
    whatsapp_number TEXT NOT NULL DEFAULT '01094007239',
    whatsapp_url TEXT NOT NULL DEFAULT 'https://wa.me/201094007239',
    sound_effects_enabled BOOLEAN NOT NULL DEFAULT true,
    sound_volume NUMERIC(3, 2) NOT NULL DEFAULT 0.40,
    privacy_policy_ar TEXT DEFAULT '',
    terms_ar TEXT DEFAULT '',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Insert default settings row if empty
INSERT INTO public.store_settings (id) VALUES ('current') ON CONFLICT (id) DO NOTHING;

-- 11. Admin Audit Logs
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id TEXT PRIMARY KEY,
    admin_email TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT NOT NULL,
    target_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_durations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topup_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper to check if current user is owner (389330adamahmedamr@gmail.com)
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (role = 'owner' OR email = '389330adamahmedamr@gmail.com')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: Users see own profile, Owner sees all
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_owner());
CREATE POLICY "Users can update own display_name/language" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Owner can update any profile" ON public.profiles FOR UPDATE USING (public.is_owner());

-- Public can read active categories, products, and durations
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (is_active = true OR public.is_owner());
CREATE POLICY "Public read product_durations" ON public.product_durations FOR SELECT USING (is_active = true OR public.is_owner());

-- Owner can insert/update/delete categories, products, durations
CREATE POLICY "Owner manage categories" ON public.categories FOR ALL USING (public.is_owner());
CREATE POLICY "Owner manage products" ON public.products FOR ALL USING (public.is_owner());
CREATE POLICY "Owner manage product_durations" ON public.product_durations FOR ALL USING (public.is_owner());

-- Inventory Codes: ONLY owner can see unsold codes! Never expose unsold codes to customers/distributors!
CREATE POLICY "Owner read all inventory_codes" ON public.inventory_codes FOR SELECT USING (public.is_owner());
CREATE POLICY "Owner manage inventory_codes" ON public.inventory_codes FOR ALL USING (public.is_owner());
CREATE POLICY "User read their own purchased code" ON public.inventory_codes FOR SELECT USING (sold_to_user_id = auth.uid());

-- Orders: Users read own orders, Owner reads all
CREATE POLICY "Users read own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id OR public.is_owner());
CREATE POLICY "Users can insert orders via trusted function" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Topup Requests: Users read own requests, insert requests; Owner reviews
CREATE POLICY "Users read own topups" ON public.topup_requests FOR SELECT USING (auth.uid() = user_id OR public.is_owner());
CREATE POLICY "Users create topup requests" ON public.topup_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner manage topups" ON public.topup_requests FOR ALL USING (public.is_owner());

-- Wallet Transactions: Users read own transactions, Owner reads all
CREATE POLICY "Users read own transactions" ON public.wallet_transactions FOR SELECT USING (auth.uid() = user_id OR public.is_owner());

-- Store Settings: Public read settings, Owner updates
CREATE POLICY "Public read store settings" ON public.store_settings FOR SELECT USING (true);
CREATE POLICY "Owner update store settings" ON public.store_settings FOR ALL USING (public.is_owner());

-- Admin Logs: Only owner
CREATE POLICY "Owner view audit logs" ON public.admin_audit_logs FOR ALL USING (public.is_owner());

-- ==============================================================================
-- AUTOMATIC NEW USER HANDLER: Automatically assign Owner role to 389330adamahmedamr@gmail.com
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  assigned_role user_role;
BEGIN
  IF NEW.email = '389330adamahmedamr@gmail.com' THEN
    assigned_role := 'owner';
  ELSE
    assigned_role := 'customer';
  END IF;

  INSERT INTO public.profiles (id, email, display_name, role, balance, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    assigned_role,
    0.00,
    'active'
  )
  ON CONFLICT (id) DO UPDATE SET
    role = CASE WHEN NEW.email = '389330adamahmedamr@gmail.com' THEN 'owner' ELSE profiles.role END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==============================================================================
-- ATOMIC PURCHASE TRANSACTION FUNCTION (Prevents Race Conditions and Double-Selling)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.purchase_code_atomic(
  p_product_id TEXT,
  p_duration_id TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_user public.profiles%ROWTYPE;
  v_duration public.product_durations%ROWTYPE;
  v_product public.products%ROWTYPE;
  v_code public.inventory_codes%ROWTYPE;
  v_price NUMERIC(10, 2);
  v_order_id TEXT;
  v_tx_id TEXT;
BEGIN
  -- 1. Check user authentication
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 2. Lock user record to prevent race conditions on balance
  SELECT * INTO v_user FROM public.profiles WHERE id = v_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  -- 3. Retrieve product & duration
  SELECT * INTO v_product FROM public.products WHERE id = p_product_id AND is_active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not active or not found';
  END IF;

  SELECT * INTO v_duration FROM public.product_durations WHERE id = p_duration_id AND is_active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Duration not active or not found';
  END IF;

  -- 4. Calculate price based on role
  IF v_user.role = 'distributor' THEN
    v_price := v_duration.distributor_price;
  ELSE
    v_price := v_duration.customer_price;
  END IF;

  -- 5. Check user balance
  IF v_user.balance < v_price THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- 6. Lock an unsold active code with SKIP LOCKED for concurrency
  SELECT * INTO v_code
  FROM public.inventory_codes
  WHERE duration_id = p_duration_id
    AND is_sold = false
    AND is_active = true
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Out of stock';
  END IF;

  -- 7. Deduct balance
  UPDATE public.profiles
  SET balance = balance - v_price,
      updated_at = now()
  WHERE id = v_user_id;

  -- 8. Generate IDs
  v_order_id := 'ORD-' || upper(substr(md5(random()::text), 1, 8));
  v_tx_id := 'TX-' || upper(substr(md5(random()::text), 1, 8));

  -- 9. Mark code as sold
  UPDATE public.inventory_codes
  SET is_sold = true,
      sold_to_user_id = v_user_id,
      sold_to_user_email = v_user.email,
      sold_at = now(),
      order_id = v_order_id
  WHERE id = v_code.id;

  -- 10. Record order
  INSERT INTO public.orders (
    id, user_id, user_email, user_role, product_id, product_name,
    duration_id, duration_label, price_paid, code_delivered, status
  ) VALUES (
    v_order_id, v_user_id, v_user.email, v_user.role, v_product.id, v_product.name_ar,
    v_duration.id, v_duration.label_ar, v_price, v_code.code, 'completed'
  );

  -- 11. Record transaction
  INSERT INTO public.wallet_transactions (
    id, user_id, type, amount, balance_before, balance_after, description
  ) VALUES (
    v_tx_id, v_user_id, 'purchase', -v_price, v_user.balance, v_user.balance - v_price,
    'شراء ' || v_product.name_ar || ' (' || v_duration.label_ar || ')'
  );

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'code', v_code.code,
    'price_paid', v_price,
    'new_balance', v_user.balance - v_price
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
