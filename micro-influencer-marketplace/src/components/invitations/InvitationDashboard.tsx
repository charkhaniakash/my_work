'use client'

export default function InvitationDashboard() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Campaign Actions</h2>
        <div className="space-y-4">
          <button
            onClick={() => window.location.href = '/dashboard/campaigns/new?type=invite-only'}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Invite-Only Campaign
          </button>
          <button
            onClick={() => window.location.href = '/dashboard/invitations/discover'}
            className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Discover Influencers
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Invitation Overview</h2>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Pending Invitations</span>
            <span className="font-semibold">0</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Accepted Invitations</span>
            <span className="font-semibold">0</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Declined Invitations</span>
            <span className="font-semibold">0</span>
          </div>
        </div>
      </div>
    </div>
  )
} 