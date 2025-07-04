export type UserRole = 'brand' | 'influencer'
export type PricingTier = 'basic' | 'standard' | 'premium'
export type CampaignStatus = 'draft' | 'active' | 'completed' | 'cancelled'
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected'

export interface User {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  role: 'brand' | 'influencer'
  created_at: string
  updated_at: string
  user_metadata?: {
    full_name?: string
    role?: string
  }
}

export interface BrandProfile {
  id: string
  user_id: string
  company_name: string
  industry: string
  website: string | null
  description: string | null
  location: string | null
  company_size: string | null
  budget_range: string | null
  created_at: string
  updated_at: string
}

export interface InfluencerProfile {
  id: string
  user_id: string
  bio: string | null
  niche: string[]
  location: string | null
  pricing_tier: PricingTier
  min_rate: number
  max_rate: number
  languages: string[]
  social_links: {
    instagram?: string
    tiktok?: string
    youtube?: string
    twitter?: string
    linkedin?: string
  }
  created_at: string
  updated_at: string
}

export interface Campaign {
  id: string
  brand_id: string
  title: string
  description: string
  budget: number
  start_date: string
  end_date: string
  target_location?: string
  target_niche: string[]
  requirements: string
  deliverables: string
  status: 'scheduled' | 'active' | 'paused' | 'completed'
  created_at: string
  updated_at?: string
  notes?: string
}

export interface CampaignApplication {
  id: string
  campaign_id: string
  influencer_id: string
  status: 'pending' | 'accepted' | 'rejected'
  pitch: string
  proposed_rate: number
  created_at: string
  updated_at?: string
}

export interface MessageAttachment {
  id: string
  message_id: string
  file_name: string
  file_size: number
  file_type: string
  file_url: string
  created_at: string
}

export interface TypingUser {
  id: string
  conversation_id: string
  user_id: string
  last_typed: string
}

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  conversation_id: string
  is_read: boolean
  delivered: boolean
}

export interface Conversation {
  id: string
  brand_id: string
  influencer_id: string
  campaign_id: string | null
  last_message_at: string
  created_at: string
  updated_at: string
  // Join fields
  brand?: User
  influencer?: User
  campaign?: Campaign
  last_message?: Message
}

export type CampaignTemplate = {
  id: string;
  brand_id: string;
  title: string;
  description: string;
  budget: number;
  target_location?: string;
  target_niche: string[];
  requirements?: string;
  deliverables?: string;
  created_at: string;
  updated_at: string;
};

export interface UserPresence {
  user_id: string
  online: boolean
  last_seen: string
}

export interface TypingStatus {
  conversation_id: string
  user_id: string
  is_typing: boolean
  timestamp: string
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User
        Insert: Omit<User, 'created_at' | 'updated_at'>
        Update: Partial<Omit<User, 'id'>>
      }
      brand_profiles: {
        Row: BrandProfile
        Insert: Omit<BrandProfile, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<BrandProfile, 'id' | 'user_id'>>
      }
      influencer_profiles: {
        Row: InfluencerProfile
        Insert: Omit<InfluencerProfile, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<InfluencerProfile, 'id' | 'user_id'>>
      }
      campaigns: {
        Row: Campaign
        Insert: Omit<Campaign, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Campaign, 'id' | 'brand_id'>>
      }
      campaign_applications: {
        Row: CampaignApplication
        Insert: Omit<CampaignApplication, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<CampaignApplication, 'id' | 'campaign_id' | 'influencer_id'>>
      }
      messages: {
        Row: Message
        Insert: Omit<Message, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Message, 'id' | 'conversation_id' | 'sender_id'>>
      }
      conversations: {
        Row: Conversation
        Insert: Omit<Conversation, 'id' | 'created_at' | 'updated_at' | 'last_message_at'>
        Update: Partial<Omit<Conversation, 'id' | 'brand_id' | 'influencer_id'>>
      }
      message_attachments: {
        Row: MessageAttachment
        Insert: Omit<MessageAttachment, 'id' | 'created_at'>
        Update: Partial<Omit<MessageAttachment, 'id' | 'message_id'>>
      }
      typing_users: {
        Row: TypingUser
        Insert: Omit<TypingUser, 'id' | 'last_typed'>
        Update: Partial<Omit<TypingUser, 'id' | 'conversation_id' | 'user_id'>>
      }
      user_presence: {
        Row: UserPresence
        Insert: Omit<UserPresence, 'last_seen'>
        Update: Partial<Omit<UserPresence, 'user_id'>>
      }
      typing_status: {
        Row: TypingStatus
        Insert: Omit<TypingStatus, 'timestamp'>
        Update: Partial<Omit<TypingStatus, 'conversation_id' | 'user_id'>>
      }
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Insertable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updateable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'] 