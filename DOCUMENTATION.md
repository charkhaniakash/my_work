# Micro-Influencer Marketplace: Comprehensive Documentation

## 1. Introduction

The Micro-Influencer Marketplace is a web platform designed to streamline the process of connecting brands with micro-influencers for collaborative marketing campaigns. It provides a dedicated environment for brands to initiate campaigns and discover suitable influencers, and for influencers to find campaign opportunities and manage their collaborations.

## 2. Problem Statement

Traditional methods of identifying, engaging, and managing micro-influencers are often manual, time-consuming, and inefficient for both brands and influencers. Brands struggle to:

*   Discover relevant micro-influencers with authentic engagement within specific niches.
*   Manage communication, applications, and contracts across multiple influencer collaborations.
*   Track campaign performance and ensure deliverables are met.

Micro-influencers, on the other hand, face challenges in:

*   Finding legitimate and relevant paid collaboration opportunities.
*   Effectively showcasing their value and pitching to brands.
*   Managing multiple applications and tracking their statuses.
*   Ensuring timely payment for their work.

This marketplace aims to solve these problems by providing a centralized, efficient, and transparent platform for both parties.

## 3. Solution Overview

The platform acts as an intermediary, offering tools and features that simplify the entire lifecycle of a micro-influencer marketing campaign, from discovery and application to management and tracking. It provides distinct user experiences tailored to the needs of brands and influencers.

## 4. Key Features

### 4.1. General Features (Brands & Influencers)

*   **User Authentication:** Secure registration and login for both brand and influencer accounts.
*   **Profile Management:** Dedicated profiles for brands (company information) and influencers (portfolio, social media links, niche, audience demographics).
*   **Dashboard:** Personalized dashboard providing an overview of relevant activities, notifications, and key statistics.

### 4.2. Features for Brands

*   **Campaign Creation & Management:** Intuitive interface to create detailed campaign briefs, including objectives, requirements, deliverables, budget, target audience, and timeline. Ability to edit, pause, or close active campaigns.
*   **Influencer Discovery & Outreach:** Search and filter micro-influencers based on various criteria (niche, follower count range, engagement rate estimates, etc.). Option to directly invite selected influencers to campaigns.
*   **Application Review & Management:** Centralized view of all applications for their campaigns. Detailed view of each influencer's application, pitch, and proposed rate. Tools to accept, reject, or communicate with applicants.
*   **Campaign Performance Tracking:** Overview of campaign progress, accepted influencers, and potentially (future feature) tools for tracking deliverables and performance metrics.
*   **Invitation Management:** Track the status of sent invitations.
*   **Payment Processing:** Ability to process payments for accepted applications, moving them from 'accepted' to 'pending_payment' to 'approved_and_paid' status.
*   **Campaign Scheduling:** Create campaigns with future start dates, which automatically activate on the scheduled date.

### 4.3. Features for Influencers

*   **Campaign Browsing & Discovery:** Browse a feed of available campaigns with filtering and search options. Detailed view of campaign briefs to understand requirements and compensation.
*   **Campaign Application Submission:** Easy process to apply to campaigns, including submitting a custom pitch and proposing a rate.
*   **Application Status Tracking:** A dedicated page to view all submitted applications and monitor their current status (Pending, Accepted, Rejected, Pending Payment, Approved & Paid).
*   **Invitation Response:** Ability to view and respond to direct campaign invitations from brands. Option to accept or decline, and provide a pitch/rate upon acceptance.
*   **Notification System:** Receive notifications for new campaign invitations, application status updates, scheduled campaigns, and campaign activations.
*   **Campaign Start Date Awareness:** Clear indication when campaigns haven't started yet, with prevention of applying to campaigns before their start date.

## 5. High-Level Architecture

The application follows a modern web architecture, primarily utilizing the **Next.js** framework for both frontend and backend (API routes). **Supabase** serves as the backend-as-a-service, providing the **PostgreSQL** database, authentication services, and potentially file storage.

*   **Frontend:** Built with React using Next.js, responsible for rendering the user interface and handling client-side logic.
*   **Backend (API Routes):** Next.js API routes handle requests from the frontend, interacting with the database and external services.
*   **Database:** PostgreSQL database managed by Supabase, storing all persistent data.
*   **Authentication:** Handled by Supabase Auth, providing secure user registration and session management.
*   **Background Jobs:** Automated processes for campaign activation and expiration based on start and end dates.

## 6. Tech Stack Details

*   **Frontend Framework:** Next.js (React) - Chosen for its server-side rendering capabilities, file-system based routing, API routes, and overall developer experience.
*   **Backend/Database/Auth:** Supabase - Provides a scalable PostgreSQL database, robust authentication, and simplifies backend development with its API layer and real-time capabilities.
*   **Database Language:** PostgreSQL - A powerful, open-source relational database system.
*   **Styling:** Tailwind CSS - A utility-first CSS framework for rapid UI development and consistent design.
*   **Language:** TypeScript - Used throughout the project for improved code quality, maintainability, and reduced runtime errors.
*   **State Management:** React Hooks and Context API - Standard React features for managing component and application state.
*   **Deployment:** (Mention planned or current deployment platform, e.g., Vercel, Netlify, own server)
*   **Other Key Libraries:** (List notable libraries like `react-hook-form` for forms, `@supabase/supabase-js` for database interaction, etc. - *Requires checking `package.json` for an exhaustive list*)

## 7. Data Model (Basic Entities)

The core of the application revolves around several key entities and their relationships:

*   `users`: Stores basic user information (authentication). Linked to profiles.
*   `brand_profiles`: Stores detailed information for brand users.
*   `influencer_profiles`: Stores detailed information and portfolio for influencer users.
*   `campaigns`: Represents marketing campaigns created by brands, with status: 'scheduled', 'active', 'paused', or 'completed'.
*   `campaign_applications`: Records an influencer's application to a specific campaign, including pitch and proposed rate. Status can be 'pending', 'accepted', 'rejected', 'pending_payment', or 'approved_and_paid'.
*   `campaign_invitations`: Records a brand's invitation to an influencer for a specific campaign.
*   `notifications`: Stores user notifications (e.g., new invitations, application status updates).

These entities are related to represent the connections between users, campaigns, applications, and invitations.

## 8. Recent Enhancements

### 8.1. Payment System Integration

The platform now includes a more sophisticated payment flow:
*   When a brand accepts an application, the status changes to 'pending_payment'
*   Brands see "Payment Required" indicators and "Make Payment" buttons for accepted applications
*   After payment is processed, the status changes to 'approved_and_paid'
*   Clear visual indicators of payment status throughout the UI

### 8.2. Campaign Scheduling System

*   **Automated Campaign Activation**: Campaigns created with future start dates are automatically activated on the start date
*   **Notification System**: 
    - Influencers receive "Upcoming Campaign" notifications when scheduled campaigns are created
    - Influencers receive additional notifications when scheduled campaigns become active
*   **Application Prevention**: Influencers cannot apply to campaigns before their start date, with clear messages explaining when the campaign will begin

### 8.3. Invitation System Improvements

*   **Application Status Awareness**: The system prevents brands from inviting influencers who have already applied or been accepted to a campaign
*   **Status Visibility**: Clear status indicators for invitations showing whether they are pending, accepted, or declined
*   **Activity Summaries**: Influencer discovery interface now shows a summary of each influencer's activity with your brand

### 8.4. UI/UX Improvements

*   **Status Clarity**: Enhanced status badges with clear labels like "Invitation Pending" vs "Application Pending"
*   **Educational UI**: Added explanatory sections to clarify the difference between invitations and applications
*   **Consistent Terminology**: Standardized status labels and button text across the application

## 9. Future Considerations

Potential future enhancements could include:

*   In-platform messaging between brands and influencers.
*   More advanced payment processing integration with escrow capabilities.
*   Advanced analytics and reporting for campaigns.
*   Rating and review system for brands and influencers.
*   More sophisticated search and filtering for influencers/campaigns.
*   Campaign templates and recommendation engine.
*   Mobile application development.

This documentation provides a solid foundation for understanding the Micro-Influencer Marketplace project. 