This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Invitation System

The platform includes a comprehensive invitation system that allows brands to directly invite influencers to their campaigns:

### Key Features

1. **Database Structure**
   - Invitations table with relationships to campaigns, brands, and influencers
   - Row-level security for data protection
   - Automatic conversion of accepted invitations to campaign applications

2. **API Endpoints**
   - `POST /api/campaigns/invitations` - Send invitations to influencers
   - `GET /api/campaigns/invitations` - List or retrieve invitations with filtering
   - `PATCH /api/campaigns/invitations` - Accept or decline invitations

3. **Notification System**
   - Real-time notifications when invitations are sent
   - Notifications when influencers respond to invitations

4. **User Interface Components**
   - InvitationCard - Display invitation details with accept/decline actions
   - InviteInfluencerButton - Send personalized invitations with custom messages
   - PendingInvitations - Dashboard component showing pending invitations
   - InvitationsList - Tabbed interface to manage all invitations

5. **Integration**
   - Recommended influencers show invitation status
   - Dashboard displays pending invitations
   - Dedicated invitation management page for influencers

### Workflow

1. Brand discovers influencers through campaign recommendations
2. Brand sends personalized invitation with optional custom message and rate
3. Influencer receives notification and views invitation details
4. Influencer can accept or decline the invitation
5. Accepting automatically creates an approved campaign application
