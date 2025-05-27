# Micro-Influencer Marketplace – Project Overview

## What is this app?
A platform connecting brands and influencers for marketing campaigns. Brands create campaigns, discover influencers, manage applications, collaborate, and track performance. Influencers apply to campaigns, manage their profiles, and communicate with brands.

---

## Main Concepts

### Brand
A business or client looking to promote products/services. Brands create campaigns, review influencer applications, select influencers, and manage the campaign process.

### Campaign
A marketing project created by a brand to achieve a specific goal (e.g., product launch, brand awareness). Contains title, description, budget, dates, requirements, deliverables, and target audience/niche. Influencers apply to campaigns, and brands select who to work with. Each campaign has its own files, notes, deliverable checklist, and analytics.

---

## Key Features

- **User Roles:** Brand and Influencer, each with tailored dashboards and permissions.
- **Campaign Management:** Create, schedule, and manage campaigns. Save and reuse campaign templates.
- **Collaboration Tools:** Internal notes, shared files, and deliverable checklists for each campaign.
- **Influencer Discovery:** Brands can search and filter influencers by niche, location, etc.
- **Applications:** Influencers apply to campaigns; brands review, accept, or reject applications.
- **Invitation System:** Brands can directly invite specific influencers to campaigns.
- **Messaging:** Real-time chat between brands and influencers.
- **Profile Management:** Influencers manage bio, social links, portfolio, and analytics. Brands manage company info.
- **Analytics:** Campaign and influencer performance metrics, including charts.
- **Security:** Role-based access, authentication with Clerk, and RLS for data protection.
- **Conflict Resolution:** Smart handling of invitation-application conflicts to prevent duplicates.

---

## Application Flow: Brands & Influencers

### How Brands Wait for Applications
- Brands create a campaign from their dashboard.
- The campaign appears in the "Available Campaigns" list for influencers.
- Brands simply wait; influencers can see and apply to the campaign.
- Brands can view all applications for a campaign in the **Applications** section of the campaign detail page (`/dashboard/campaigns/[id]`).
- For each application, brands can **accept** or **reject**.

### How Influencers Browse and Apply
- Influencers log in and go to the "Available Campaigns" page (e.g., `/dashboard/available-campaigns`).
- They can browse campaigns, click to view details, and apply by submitting a pitch and proposed rate.
- Influencers can track the status of their applications in their dashboard.

**Where to see this in the UI:**
- **Brands:** Campaign detail page → Applications section
- **Influencers:** Available Campaigns page → Campaign detail page → Apply button/form

---

## User Flow

### For Brands
1. Sign Up / Log In
2. Create a Campaign (or use a template)
3. Wait for Applications from influencers OR Send Invitations to specific influencers
4. Review Applications/Invitations (accept/reject)
5. Message Influencers and collaborate
6. Manage Campaign (notes, files, checklist)
7. Track Performance (analytics dashboard)

### For Influencers
1. Sign Up / Log In
2. Complete Profile (bio, social links, portfolio)
3. Browse Campaigns and apply OR Respond to invitations
4. Message Brands if accepted
5. Collaborate on Campaign (access files, checklist)
6. Track Own Analytics

---

## Pending Features
- Payment Integration (secure payments, escrow, invoices)
- Notifications (in-app, email)
- Reviews & Ratings (post-campaign)
- Advanced Search & Recommendations
- Content Management (calendar, approval workflow)
- Mobile Responsiveness & PWA

---

## Tech Stack
- **Frontend:** React (Next.js), Clerk (auth), Tailwind CSS
- **Backend:** Supabase (Postgres, RLS, Storage, Functions)
- **Charts:** recharts
- **Notifications:** react-hot-toast
- **File Uploads:** (Demo: local URLs, Production: Supabase Storage/S3)

---

## How to Run
1. Install dependencies: `npm install`
2. Set up environment variables for Supabase and Clerk.
3. Run the app: `npm run dev`
4. Apply migrations to your Supabase database.

---

## Contribution
- All features are modular and can be extended.
- Pending features are listed above—pick one and start building! 

## Core Features

### 1. User Authentication & Profiles
- **Authentication Flow**:
  - Sign up with email/password
  - Sign in with email/password
  - Password reset functionality
  - Email verification
  - Session management with Supabase Auth

- **Profile Management**:
  - User profile creation and editing
  - Role-based profiles (Brand/Influencer)
  - Profile verification system
  - Profile completion status tracking

### 2. Campaign Management
- **Campaign Creation Flow**:
  1. Brand creates campaign with details
  2. Campaign goes through approval process
  3. Campaign becomes visible to influencers
  4. Influencers can apply or get invited
  5. Brand reviews applications/invitations
  6. Campaign status updates

- **Campaign Types**:
  - Open campaigns (any influencer can apply)
  - Invite-only campaigns (brand invites specific influencers)
  - Private campaigns (visible only to invited influencers)

### 3. Application & Invitation System
- **Application Flow**:
  1. Influencer views available campaigns
  2. Submits application with required details
  3. Brand receives application notification
  4. Brand reviews and responds (accept/reject)
  5. Influencer receives status update notification

- **Invitation Flow**:
  1. Brand creates campaign and selects "Invite Only"
  2. Brand searches for influencers
  3. Brand sends invitations to selected influencers
  4. Influencers receive invitation notifications
  5. Influencers can accept or decline
  6. Brand receives response notifications
  7. Accepted influencers can start collaboration

- **Conflict Resolution System** ⭐ NEW:
  - **Database Level Protection**:
    - Unique constraint on `campaign_applications` table prevents duplicate applications
    - Smart triggers handle invitation acceptance and application conflicts
    - Prevention triggers block direct applications when invitation already accepted
  
  - **Frontend Intelligence**:
    - Real-time checking of invitation status before showing application forms
    - Visual feedback for different conflict scenarios
    - Clear messaging and user guidance for resolution
  
  - **Scenario Handling**:
    - **Case 1**: Influencer accepts invitation first → Prevents duplicate application attempts
    - **Case 2**: Influencer applies first → Invitation acceptance updates existing application
    - **Case 3**: Pending invitation exists → Shows warning but allows direct application choice
  
  - **User Experience**:
    - Campaign detail pages show invitation status with appropriate messaging
    - Available campaigns page handles conflicts gracefully
    - Clear navigation to relevant pages (applications, invitations)

### 4. Messaging System
- **Direct Messaging Flow**:
  1. Users can message after connection
  2. Real-time message updates
  3. Message notifications
  4. Conversation history
  5. File sharing capabilities

### 5. Notification System
- **Notification Types**:
  1. Message Notifications
     - New message received
     - Message read status
     - Conversation updates

  2. Application Notifications
     - New application received (for brands)
     - Application status updates (for influencers)
     - Application reminders

  3. Campaign Notifications
     - New campaign available
     - Campaign status changes
     - Campaign deadline reminders

  4. Invitation Notifications
     - New invitation received
     - Invitation response (accepted/declined)
     - Invitation reminders

  5. Invitation Response Notifications
     - Invitation accepted (for brands)
     - Invitation declined (for brands)
     - Follow-up actions

- **Notification Preferences**:
  - Users can enable/disable specific notification types
  - Email notification settings
  - In-app notification settings
  - Notification frequency controls

- **Smart Redirects** ⭐ UPDATED:
  - Campaign notifications redirect to specific campaign pages (`/dashboard/campaigns/${campaignId}`)
  - Application notifications redirect to applications page with proper filtering
  - Invitation notifications redirect to invitations page
  - All notifications include relevant context and actionable links

### 6. Analytics & Reporting
- Campaign performance metrics
- Influencer engagement analytics
- Brand campaign success rates
- ROI tracking
- Custom report generation

## Technical Architecture

### Frontend
- Next.js 14 with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- React Query for data fetching
- Zustand for state management

### Backend
- Supabase for:
  - Authentication
  - Database
  - Real-time subscriptions
  - Storage
  - Edge Functions

### Database Schema
- Users table
- Profiles table
- Campaigns table
- Applications table (with unique constraints)
- Campaign Invitations table (with unique constraints)
- Messages table
- Notifications table
- Notification Preferences table

### API Routes
- Authentication endpoints
- Campaign management
- Application processing (with conflict handling)
- Invitation system (with response handling)
- Messaging system
- Notification handling
- Analytics endpoints

## Security Features
- Role-based access control
- Data encryption
- Input validation
- Rate limiting
- CORS configuration
- XSS protection
- Duplicate prevention (applications/invitations)

## Performance Optimizations
- Server-side rendering
- Image optimization
- Caching strategies
- Lazy loading
- Code splitting

## Deployment
- Vercel for frontend
- Supabase for backend
- CI/CD pipeline
- Environment configuration
- Monitoring and logging

## Recent Updates & Improvements

### Sidebar Component Integration (Latest)
**Problem Solved**: Dashboard layout was not using the dedicated Sidebar component, causing duplicate code and missing features. Also fixed navigation structure to show appropriate links for each role.

**Implementation**:
- Removed inline `SidebarContent` component from `layout.tsx`
- Integrated the proper `Sidebar.tsx` component with all its features
- Fixed navigation links to match actual application routes
- **Enhanced role-based navigation structure**:
  - **For Brands**: My Campaigns, Create Campaign, Available Campaigns, Applications, Messages, Notifications, Profile, Transactions
  - **For Influencers**: Available Campaigns, My Applications, My Invitations, Messages, Notifications, Profile, My Earnings
- Updated "Invitations" to "My Invitations" linking to `/dashboard/influencer/invitations`
- Added "Available Campaigns" for brands to see what's available in the marketplace
- Maintained real-time unread badges for messages and notifications
- Preserved role-based navigation structure

**Files Modified**:
- `src/app/dashboard/layout.tsx` - Removed duplicate sidebar code, integrated Sidebar component
- `src/components/Sidebar.tsx` - Fixed navigation routes and enhanced role-based navigation

**User Benefits**:
- Consistent navigation experience across the application
- Real-time unread message and notification badges working properly
- **Comprehensive role-based navigation** (brands and influencers see all relevant options)
- Proper routing to influencer-specific invitations page
- Better code maintainability with single sidebar component
- Both roles can access available campaigns for discovery

### Invitation-Application Conflict Resolution (Previous)
**Problem Solved**: Prevented duplicate applications when influencers accept invitations and then try to apply directly.

**Implementation**:
- Database unique constraints and smart triggers
- Frontend conflict detection and user guidance
- Graceful error handling with clear messaging
- Enhanced user experience with status indicators

**Files Modified**:
- `supabase/migrations/20240526000000_add_unique_constraint_applications.sql`
- `src/app/dashboard/campaigns/[id]/page.tsx`
- `src/app/dashboard/available-campaigns/page.tsx`
- `src/lib/services/notification-service.ts`

**User Benefits**:
- No more duplicate applications
- Clear understanding of invitation vs application status
- Seamless workflow regardless of interaction path
- Better data integrity and user experience

### Notification System Improvements (Earlier)
**Problem Solved**: Notifications redirected to generic pages instead of specific, actionable destinations.

**Implementation**:
- Updated notification links to include specific campaign IDs
- Enhanced available campaigns page with URL parameter support
- Added visual highlighting and auto-scroll for notification-accessed campaigns

## Future Enhancements
- Advanced analytics
- AI-powered matching
- Payment integration
- Mobile app development
- Enhanced reporting tools
- Advanced conflict resolution for complex scenarios 