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
  language?: string
}

export interface SearchResult extends Creator {
  recent_brands: string[]
  collab_count: number
}
