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
- **Messaging:** Real-time chat between brands and influencers.
- **Profile Management:** Influencers manage bio, social links, portfolio, and analytics. Brands manage company info.
- **Analytics:** Campaign and influencer performance metrics, including charts.
- **Security:** Role-based access, authentication with Clerk, and RLS for data protection.

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
3. Wait for Applications from influencers
4. Review Applications (accept/reject)
5. Message Influencers and collaborate
6. Manage Campaign (notes, files, checklist)
7. Track Performance (analytics dashboard)

### For Influencers
1. Sign Up / Log In
2. Complete Profile (bio, social links, portfolio)
3. Browse Campaigns and apply
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