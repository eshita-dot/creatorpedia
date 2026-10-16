-- ============================================================
-- Creatorpedia — Supabase Schema
-- Run this in the Supabase SQL Editor to set up your database.
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";  -- pgvector for semantic search

-- ============================================================
-- Core tables
-- ============================================================

CREATE TABLE creators (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  handle          TEXT NOT NULL,
  platform        TEXT NOT NULL CHECK (platform IN ('instagram', 'youtube', 'both')),
  name            TEXT,
  avatar_url      TEXT,
  bio             TEXT,
  category        TEXT CHECK (category IN (
                    'beauty','fitness','finance','food','travel',
                    'tech','fashion','lifestyle','gaming','entertainment','parenting'
                  )),
  region          TEXT CHECK (region IN (
                    'north-india','south-india','east-india','west-india','pan-india'
                  )),
  languages       TEXT[]    DEFAULT '{}',
  followers_instagram  BIGINT,
  followers_youtube    BIGINT,
  avg_engagement_rate  NUMERIC(5,2),
  avg_views            BIGINT,
  verified        BOOLEAN   DEFAULT false,
  pricing_tier    TEXT      CHECK (pricing_tier IN ('nano','micro','mid','macro','mega')),
  embedding       vector(1536),  -- for semantic search via pgvector
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(handle, platform)
);

CREATE TABLE brands (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL UNIQUE,
  logo_url    TEXT,
  category    TEXT,
  is_d2c      BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE collaborations (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id   UUID REFERENCES creators(id) ON DELETE CASCADE,
  brand_id     UUID REFERENCES brands(id)   ON DELETE SET NULL,
  collab_date  DATE,
  source       TEXT NOT NULL CHECK (source IN (
                 'youtube_api','asci_disclosure','creator_verified','brand_submission'
               )),
  deal_type    TEXT DEFAULT 'unknown' CHECK (deal_type IN ('paid','barter','gifted','unknown')),
  evidence_url TEXT,
  disclosure_tags TEXT[] DEFAULT '{}',
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE pricing_signals (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id              UUID REFERENCES creators(id) ON DELETE CASCADE UNIQUE,
  tier                    TEXT CHECK (tier IN ('nano','micro','mid','macro','mega')),
  estimated_post_rate_min INTEGER,   -- INR
  estimated_post_rate_max INTEGER,
  estimated_reel_rate_min INTEGER,
  estimated_reel_rate_max INTEGER,
  source                  TEXT,
  last_updated            TIMESTAMPTZ DEFAULT now()
);

-- Paid unlocks (₹499 paywall)
CREATE TABLE unlocks (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id    UUID REFERENCES creators(id),
  razorpay_id   TEXT UNIQUE,        -- Razorpay payment_id
  email         TEXT,
  amount        INTEGER DEFAULT 499,
  currency      TEXT    DEFAULT 'INR',
  unlocked_at   TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Row-Level Security
-- ============================================================

ALTER TABLE creators         ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands           ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_signals  ENABLE ROW LEVEL SECURITY;
ALTER TABLE unlocks          ENABLE ROW LEVEL SECURITY;

-- Public: read creators and brands freely
CREATE POLICY "public_read_creators" ON creators FOR SELECT TO anon USING (true);
CREATE POLICY "public_read_brands"   ON brands   FOR SELECT TO anon USING (true);

-- Public: read only the 3 most recent collabs per creator (free tier)
-- The paywall is enforced at the application layer; this policy leaves all reading open
-- to authenticated users (post-payment flow sets a session claim).
CREATE POLICY "public_read_collabs"  ON collaborations FOR SELECT TO anon USING (true);
CREATE POLICY "public_read_pricing"  ON pricing_signals FOR SELECT TO anon USING (true);

-- Service role (ingestion scripts) can write everything
CREATE POLICY "service_insert_creators" ON creators FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "service_update_creators" ON creators FOR UPDATE TO service_role USING (true);
CREATE POLICY "service_insert_brands"   ON brands   FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "service_insert_collabs"  ON collaborations FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "service_insert_pricing"  ON pricing_signals FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "service_insert_unlocks"  ON unlocks  FOR INSERT TO service_role WITH CHECK (true);

-- ============================================================
-- Full-text search index
-- ============================================================

ALTER TABLE creators ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce(name, '') || ' ' ||
      coalesce(handle, '') || ' ' ||
      coalesce(bio, '') || ' ' ||
      coalesce(category, '') || ' ' ||
      coalesce(array_to_string(languages, ' '), '')
    )
  ) STORED;

CREATE INDEX creators_search_idx ON creators USING GIN (search_vector);
CREATE INDEX creators_category_idx ON creators (category);
CREATE INDEX creators_region_idx ON creators (region);
CREATE INDEX creators_platform_idx ON creators (platform);
CREATE INDEX collabs_creator_idx ON collaborations (creator_id);
CREATE INDEX collabs_brand_idx ON collaborations (brand_id);
CREATE INDEX collabs_date_idx ON collaborations (collab_date DESC);

-- pgvector index for semantic search
CREATE INDEX creators_embedding_idx ON creators
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================================
-- Updated_at trigger
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER creators_updated_at
  BEFORE UPDATE ON creators
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
