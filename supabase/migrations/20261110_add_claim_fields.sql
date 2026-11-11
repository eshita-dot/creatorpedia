-- Run this in Supabase SQL editor: https://dkojsivhwurlghhgxbds.supabase.co

ALTER TABLE creators
  ADD COLUMN IF NOT EXISTS claim_status       TEXT    DEFAULT 'unclaimed',
  ADD COLUMN IF NOT EXISTS claimed_user_id    UUID    REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS contact_email      TEXT,
  ADD COLUMN IF NOT EXISTS instagram_handle   TEXT,
  ADD COLUMN IF NOT EXISTS rate_reel_min      INTEGER,
  ADD COLUMN IF NOT EXISTS rate_reel_max      INTEGER,
  ADD COLUMN IF NOT EXISTS rate_youtube_min   INTEGER,
  ADD COLUMN IF NOT EXISTS rate_youtube_max   INTEGER,
  ADD COLUMN IF NOT EXISTS rate_story_min     INTEGER,
  ADD COLUMN IF NOT EXISTS rate_story_max     INTEGER,
  ADD COLUMN IF NOT EXISTS available_for_collabs BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS preferred_deal_types  TEXT[]  DEFAULT '{}';

-- Allow claimed creator to update their own row
CREATE POLICY "Creator can update own claimed profile"
  ON creators FOR UPDATE
  USING (auth.uid() = claimed_user_id)
  WITH CHECK (auth.uid() = claimed_user_id);
