export type Platform = 'instagram' | 'youtube' | 'both'
export type Category =
  | 'beauty'
  | 'fitness'
  | 'finance'
  | 'food'
  | 'travel'
  | 'tech'
  | 'fashion'
  | 'lifestyle'
  | 'gaming'
  | 'entertainment'
  | 'parenting'
export type Region = 'north-india' | 'south-india' | 'east-india' | 'west-india' | 'pan-india'
export type DealType = 'paid' | 'barter' | 'gifted' | 'unknown'
export type CollabSource = 'youtube_api' | 'asci_disclosure' | 'creator_verified' | 'brand_submission'
export type PricingTier = 'nano' | 'micro' | 'mid' | 'macro' | 'mega'

export interface Creator {
  id: string
  handle: string
  platform: Platform
  name: string
  avatar_url?: string
  bio?: string
  category: Category
  region: Region
  languages: string[]
  followers_instagram?: number
  followers_youtube?: number
  avg_engagement_rate?: number
  avg_views?: number
  verified: boolean
  pricing_tier?: PricingTier
  created_at: string
  updated_at: string
  // Claim fields
  claim_status?: 'unclaimed' | 'claimed'
  claimed_user_id?: string
  contact_email?: string
  instagram_handle?: string
  rate_reel_min?: number
  rate_reel_max?: number
  rate_youtube_min?: number
  rate_youtube_max?: number
  rate_story_min?: number
  rate_story_max?: number
  available_for_collabs?: boolean
  preferred_deal_types?: string[]
}

export interface Brand {
  id: string
  name: string
  logo_url?: string
  category: string
  is_d2c: boolean
}

export interface Collaboration {
  id: string
  creator_id: string
  brand: Brand
  collab_date: string
  source: CollabSource
  deal_type: DealType
  evidence_url?: string
  disclosure_tags: string[]
  notes?: string
}

export interface PricingSignal {
  creator_id: string
  tier: PricingTier
  estimated_post_rate_min?: number
  estimated_post_rate_max?: number
  estimated_reel_rate_min?: number
  estimated_reel_rate_max?: number
}

export interface SearchFilters {
  query: string
  category?: Category
  platform?: Platform
  region?: Region
  tier?: PricingTier
  language?: string
  min_followers?: number
  max_followers?: number
  min_er?: number
  available?: boolean
  verified?: boolean
  sort?: 'followers' | 'engagement' | 'collabs' | 'recent'
  brand?: string
}

export interface SearchResult extends Creator {
  recent_brands: string[]
  collab_count: number
}
