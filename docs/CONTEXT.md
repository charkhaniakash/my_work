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

## Implementation Roadmap

### Phase 1: Project Setup and Authentication (Week 1)
1. **Initial Project Setup**
   ```bash
   # Setup steps
   1. Create Next.js project with TypeScript
   2. Install dependencies (shadcn, tailwind, supabase)
   3. Configure ESLint and Prettier
   4. Set up environment variables
   5. Initialize Supabase project
   ```

2. **Authentication System**
   ```bash
   # Implementation order
   1. Set up Supabase auth configuration
   2. Create auth context and hooks
   3. Build login page
   4. Build registration page
   5. Implement email verification
   6. Add Google OAuth integration
   ```

3. **Core User Profiles**
   ```bash
   # Implementation steps
   1. Create database tables (users, brand_profiles, influencer_profiles)
   2. Build profile creation flows
   3. Implement profile edit functionality
   4. Add avatar upload with Supabase storage
   ```

### Phase 2: Basic Platform Features (Week 2-3)
1. **Brand Dashboard**
   ```bash
   # Implementation order
   1. Create dashboard layout
   2. Build campaign creation form
   3. Implement campaign listing
   4. Add basic campaign management
   ```

2. **Influencer Discovery**
   ```bash
   # Features to implement
   1. Build search interface
   2. Implement filtering system
   3. Create influencer cards
   4. Add pagination
   ```

3. **Messaging System**
   ```bash
   # Components to build
   1. Set up real-time messaging with Supabase
   2. Create conversation list
   3. Build message thread view
   4. Add notifications
   ```

### Phase 3: Campaign Management (Week 4-5)
1. **Campaign Workflow**
   ```bash
   # Implementation steps
   1. Build campaign application system
   2. Create content submission interface
   3. Implement approval workflow
   4. Add campaign status management
   ```

2. **Content Management**
   ```bash
   # Features to implement
   1. Set up file upload system
   2. Create content review interface
   3. Build feedback system
   4. Implement content versioning
   ```

3. **Basic Analytics**
   ```bash
   # Components to build
   1. Create analytics dashboard
   2. Implement basic metrics tracking
   3. Build reporting interface
   4. Add data visualization
   ```

### Phase 4: Payments and Advanced Features (Week 6-7)
1. **Payment System**
   ```bash
   # Implementation order
   1. Set up Stripe integration
   2. Create payment flow
   3. Implement escrow system
   4. Add payment history
   ```

2. **Advanced Analytics**
   ```bash
   # Features to implement
   1. Enhanced performance metrics
   2. ROI calculations
   3. Engagement rate tracking
   4. Custom report generation
   ```

3. **Platform Enhancement**
   ```bash
   # Components to improve
   1. Add social media integration
   2. Implement AI-based matching
   3. Create verification system
   4. Build rating system
   ```

### Phase 5: Testing and Deployment (Week 8)
1. **Testing**
   ```bash
   # Testing steps
   1. Write unit tests
   2. Implement integration tests
   3. Perform end-to-end testing
   4. Conduct security audit
   ```

2. **Optimization**
   ```bash
   # Optimization tasks
   1. Performance optimization
   2. SEO implementation
   3. Mobile responsiveness
   4. Load testing
   ```

3. **Deployment**
   ```bash
   # Deployment steps
   1. Set up CI/CD pipeline
   2. Configure production environment
   3. Deploy to production
   4. Monitor and bug fixes
   ```

### Development Guidelines
1. **Code Quality**
   - Follow TypeScript best practices
   - Maintain consistent code style
   - Write comprehensive documentation
   - Use proper error handling

2. **Testing Strategy**
   - Write tests alongside feature development
   - Maintain minimum 80% code coverage
   - Include accessibility testing
   - Perform regular security audits

3. **Git Workflow**
   - Use feature branches
   - Follow conventional commits
   - Require pull request reviews
   - Maintain clean git history

4. **Performance Metrics**
   - Page load time < 3s
   - Time to Interactive < 5s
   - First Contentful Paint < 2s
   - Lighthouse score > 90
