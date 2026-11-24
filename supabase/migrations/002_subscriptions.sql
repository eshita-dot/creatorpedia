-- ============================================================
-- Migration 002: Waitlist + Subscriptions for agency early access
-- Run in Supabase SQL Editor
-- ============================================================

CREATE TABLE waitlist (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL,
  agency_name  TEXT NOT NULL,
  email        TEXT NOT NULL UNIQUE,
  use_case     TEXT,
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','invited','subscribed','rejected')),
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE subscriptions (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email                   TEXT NOT NULL,
  agency_name             TEXT,
  session_token           TEXT NOT NULL UNIQUE,
  razorpay_order_id       TEXT,
  razorpay_payment_id     TEXT UNIQUE,
  plan                    TEXT NOT NULL DEFAULT 'agency_early_access',
  status                  TEXT NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active','expired','cancelled')),
  starts_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at                 TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  created_at              TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE waitlist       ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions  ENABLE ROW LEVEL SECURITY;

-- Only service role can read/write (all checks happen server-side)
CREATE POLICY "service_all_waitlist"       ON waitlist      FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_all_subscriptions"  ON subscriptions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Index for fast session token lookup on every page load
CREATE INDEX subscriptions_session_idx ON subscriptions (session_token);
CREATE INDEX subscriptions_email_idx   ON subscriptions (email);
CREATE INDEX waitlist_email_idx        ON waitlist (email);
