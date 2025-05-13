# Micro-Influencer Marketplace App

## Overview

A marketplace platform connecting small and medium businesses with micro-influencers (1K-100K followers) for effective, affordable influencer marketing campaigns.

## Problem Statement

Small and medium businesses face several challenges with influencer marketing:
- High costs associated with engaging major influencers
- Difficulty in discovering relevant local or niche influencers
- Lack of tools for managing campaigns, content approvals, and ROI tracking

## Solution

A specialized marketplace platform that matches brands with micro-influencers based on:
- Niche expertise (fitness, food, fashion, tech, etc.)
- Geographic location (for local business targeting)
- Budget constraints
- Engagement metrics and performance data

## Core Features

### Brand Dashboard
1. **Influencer Discovery**
   - Advanced search with filters (niche, location, price range, platform)
   - Detailed influencer profiles
   - Engagement metrics and analytics

2. **Campaign Management**
   - Direct messaging with influencers
   - Campaign brief creation and sharing
   - Content approval workflow
   - Performance tracking and analytics

3. **Analytics & Reporting**
   - Campaign performance metrics
   - Engagement rate tracking
   - ROI analysis
   - Custom report generation

### Influencer Dashboard
1. **Profile Management**
   - Social media account linking
   - Portfolio showcase
   - Pricing and availability settings
   - Niche categorization

2. **Campaign Workflow**
   - Campaign offer review
   - Brief acceptance/rejection
   - Content submission
   - Secure payment processing

### Authentication
- Email-based registration and login
- Google OAuth integration
- Role-based access control (Brand/Influencer)

## Technical Architecture

### Frontend
- **Framework**: React
- **UI Components**: shadcn
- **State Management**: To be determined
- **Responsive Design**: Mobile-first approach

### Backend
- **Platform**: Supabase
  - Authentication
  - Database
  - Real-time features
  - File storage

### Integrations
- **Payments**: Stripe/Razorpay
- **AI Processing**: DeepSeek
  - Influencer scoring
  - Engagement analysis
  - Content quality assessment

## Database Schema

### Tables

1. **users**
   ```sql
   - id: uuid PRIMARY KEY
   - email: text UNIQUE NOT NULL
   - password_hash: text NOT NULL
   - role: enum('brand', 'influencer') NOT NULL
   - full_name: text NOT NULL
   - created_at: timestamp DEFAULT now()
   - updated_at: timestamp DEFAULT now()
   - last_login: timestamp
   - is_verified: boolean DEFAULT false
   - avatar_url: text
   ```

2. **brand_profiles**
   ```sql
   - id: uuid PRIMARY KEY
   - user_id: uuid REFERENCES users(id)
   - company_name: text NOT NULL
   - industry: text NOT NULL
   - website: text
   - description: text
   - location: text
   - company_size: text
   - budget_range: text
   - created_at: timestamp DEFAULT now()
   - updated_at: timestamp DEFAULT now()
   ```

3. **influencer_profiles**
   ```sql
   - id: uuid PRIMARY KEY
   - user_id: uuid REFERENCES users(id)
   - bio: text
   - niche: text[]
   - location: text
   - pricing_tier: enum('basic', 'standard', 'premium')
   - min_rate: decimal
   - max_rate: decimal
   - languages: text[]
   - created_at: timestamp DEFAULT now()
   - updated_at: timestamp DEFAULT now()
   ```

4. **social_accounts**
   ```sql
   - id: uuid PRIMARY KEY
   - influencer_id: uuid REFERENCES influencer_profiles(id)
   - platform: enum('instagram', 'tiktok', 'youtube', 'twitter')
   - username: text NOT NULL
   - follower_count: integer
   - engagement_rate: decimal
   - account_url: text NOT NULL
   - is_verified: boolean DEFAULT false
   - created_at: timestamp DEFAULT now()
   - updated_at: timestamp DEFAULT now()
   ```

5. **campaigns**
   ```sql
   - id: uuid PRIMARY KEY
   - brand_id: uuid REFERENCES brand_profiles(id)
   - title: text NOT NULL
   - description: text NOT NULL
   - requirements: text
   - budget: decimal NOT NULL
   - start_date: date NOT NULL
   - end_date: date NOT NULL
   - status: enum('draft', 'active', 'completed', 'cancelled')
   - target_niche: text[]
   - target_location: text
   - created_at: timestamp DEFAULT now()
   - updated_at: timestamp DEFAULT now()
   ```

6. **campaign_applications**
   ```sql
   - id: uuid PRIMARY KEY
   - campaign_id: uuid REFERENCES campaigns(id)
   - influencer_id: uuid REFERENCES influencer_profiles(id)
   - status: enum('pending', 'accepted', 'rejected')
   - proposed_rate: decimal NOT NULL
   - pitch: text
   - created_at: timestamp DEFAULT now()
   - updated_at: timestamp DEFAULT now()
   ```

7. **content_submissions**
   ```sql
   - id: uuid PRIMARY KEY
   - campaign_id: uuid REFERENCES campaigns(id)
   - influencer_id: uuid REFERENCES influencer_profiles(id)
   - content_url: text NOT NULL
   - content_type: enum('image', 'video', 'text')
   - status: enum('pending', 'approved', 'rejected')
   - feedback: text
   - created_at: timestamp DEFAULT now()
   - updated_at: timestamp DEFAULT now()
   ```

8. **payments**
   ```sql
   - id: uuid PRIMARY KEY
   - campaign_id: uuid REFERENCES campaigns(id)
   - influencer_id: uuid REFERENCES influencer_profiles(id)
   - amount: decimal NOT NULL
   - status: enum('pending', 'completed', 'failed')
   - transaction_id: text
   - created_at: timestamp DEFAULT now()
   - updated_at: timestamp DEFAULT now()
   ```

9. **messages**
   ```sql
   - id: uuid PRIMARY KEY
   - sender_id: uuid REFERENCES users(id)
   - receiver_id: uuid REFERENCES users(id)
   - campaign_id: uuid REFERENCES campaigns(id)
   - content: text NOT NULL
   - is_read: boolean DEFAULT false
   - created_at: timestamp DEFAULT now()
   ```

10. **analytics**
    ```sql
    - id: uuid PRIMARY KEY
    - campaign_id: uuid REFERENCES campaigns(id)
    - influencer_id: uuid REFERENCES influencer_profiles(id)
    - metrics: jsonb
    - platform: enum('instagram', 'tiktok', 'youtube', 'twitter')
    - recorded_at: timestamp DEFAULT now()
    ```

## Project Structure

```
├── app/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── ...
│   │   ├── brand/
│   │   │   ├── CampaignCard.tsx
│   │   │   ├── InfluencerList.tsx
│   │   │   └── ...
│   │   └── influencer/
│   │       ├── ProfileCard.tsx
│   │       ├── CampaignList.tsx
│   │       └── ...
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useCampaigns.ts
│   │   └── ...
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── stripe.ts
│   │   └── ...
│   ├── styles/
│   │   ├── globals.css
│   │   └── ...
│   ├── types/
│   │   ├── user.ts
│   │   ├── campaign.ts
│   │   └── ...
│   ├── utils/
│   │   ├── validation.ts
│   │   ├── formatting.ts
│   │   └── ...
│   └── pages/
│       ├── auth/
│       │   ├── login.tsx
│       │   ├── register.tsx
│       │   └── ...
│       ├── brand/
│       │   ├── dashboard.tsx
│       │   ├── campaigns/
│       │   └── ...
│       ├── influencer/
│       │   ├── dashboard.tsx
│       │   ├── campaigns/
│       │   └── ...
│       └── ...
├── public/
│   ├── images/
│   ├── icons/
│   └── ...
├── docs/
│   ├── CONTEXT.md
│   └── ...
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── tsconfig.json
```

## Revenue Model

1. **Transaction-based**
   - 10% commission on successful campaigns
   - Processing fee for payments

2. **Subscription Plans**
   - Premium features for brands
   - Enhanced analytics
   - Priority support
   - Advanced search filters

3. **Additional Revenue Streams**
   - Verified badges for influencers
   - Featured listings
   - Priority placement in search results

## MVP Scope

### Phase 1
1. **Core Authentication**
   - Basic sign-up/login
   - Profile creation

2. **Essential Features**
   - Basic search and discovery
   - Simple campaign creation
   - Direct messaging
   - Basic reporting

### Phase 2
1. **Enhanced Features**
   - Advanced analytics
   - Automated payments
   - Content approval workflow
   - Performance tracking

### Phase 3
1. **Premium Features**
   - AI-powered matching
   - Advanced analytics
   - API access
   - White-label solutions

## Success Metrics
- User registration (brands/influencers)
- Campaign creation rate
- Successful campaign completion rate
- Platform engagement
- Revenue growth
- User satisfaction scores
