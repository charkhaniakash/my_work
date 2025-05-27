'use client'

import { useEffect, useState } from 'react'
import { Campaign } from '@/lib/types/database'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'react-hot-toast'
import { Calendar, DollarSign, MapPin, Tag } from 'lucide-react'
import { useSupabase } from '@/lib/providers/supabase-provider'
import { useRouter, useSearchParams } from 'next/navigation'
import { createApplicationNotification, createCampaignApplicationNotification } from '@/lib/services/notification-service'

export default function AvailableCampaigns() {
  const { user } = useSupabase()
  const router = useRouter()
  const searchParams = useSearchParams()
  const highlightCampaignId = searchParams?.get('campaign')
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [appliedCampaigns, setAppliedCampaigns] = useState<string[]>([])
  const [applicationData, setApplicationData] = useState({
    pitch: '',
    proposed_rate: 0
  })

  const supabase = createClientComponentClient()

  useEffect(() => {
    if (user) {
      loadAvailableCampaigns()
      loadUserApplications()
    }
  }, [user])

  // Scroll to highlighted campaign when campaigns load
  useEffect(() => {
    if (highlightCampaignId && campaigns.length > 0) {
      const element = document.getElementById(`campaign-${highlightCampaignId}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        // Add a temporary highlight effect
        element.classList.add('ring-2', 'ring-indigo-500', 'ring-opacity-50')
        setTimeout(() => {
          element.classList.remove('ring-2', 'ring-indigo-500', 'ring-opacity-50')
        }, 3000)
      }
    }
  }, [highlightCampaignId, campaigns])

  const loadUserApplications = async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('campaign_applications')
        .select('campaign_id')
        .eq('influencer_id', user.id)
      
      if (error) throw error
      
      // Extract just the campaign IDs into an array
      const appliedIds = data?.map(app => app.campaign_id) || []
      setAppliedCampaigns(appliedIds)
    } catch (error) {
      console.error('Error loading user applications:', error)
    }
  }

  const loadAvailableCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (error) throw error

      setCampaigns(data || [])
    } catch (error) {
      toast.error('Failed to load campaigns')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async (e: React.FormEvent) => {
    console.log('handleApply')
    e.preventDefault()
    if (!user?.id || !selectedCampaign) return

    try {
      const { error, data } = await supabase.from('campaign_applications').insert({
        campaign_id: selectedCampaign.id,
        influencer_id: user.id,
        brand_id: selectedCampaign.brand_id,
        status: 'pending',
        pitch: applicationData.pitch,
        proposed_rate: applicationData.proposed_rate
      }).select().single()

      if (error) {
        // Handle the specific error for accepted invitations
        if (error.message.includes('already accepted an invitation')) {
          toast.error('You have already accepted an invitation for this campaign. Check your applications page.')
          setShowApplyModal(false)
          setApplicationData({ pitch: '', proposed_rate: 0 })
          setSelectedCampaign(null)
          return
        }
        throw error
      }

      // Update the applied campaigns list
      setAppliedCampaigns([...appliedCampaigns, selectedCampaign.id])
      
      // Create notification for the brand only
      await createCampaignApplicationNotification(
        selectedCampaign.brand_id,
        user.user_metadata?.full_name || user.email,
        selectedCampaign.title,
        data.id,
        selectedCampaign.id
      )
      
      toast.success('Application submitted successfully')
      setShowApplyModal(false)
      setApplicationData({ pitch: '', proposed_rate: 0 })
      setSelectedCampaign(null)
    } catch (error) {
      toast.error('Failed to submit application')
      console.error('Error:', error)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  // Show message if user is not an influencer
  if (user && user.user_metadata?.role !== 'influencer') {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Access Restricted</h3>
        <p className="mt-1 text-sm text-gray-500">This page is only available to influencers.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Available Campaigns
        </h2>
        <p className="mt-1 text-sm leading-6 text-gray-500">
          Browse and apply to active campaigns from brands
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {campaigns.map((campaign) => (
          <div
            key={campaign.id}
            id={`campaign-${campaign.id}`}
            className={`overflow-hidden rounded-lg bg-white shadow transition-all duration-300 ${
              highlightCampaignId === campaign.id 
                ? 'ring-2 ring-indigo-500 ring-opacity-50 shadow-lg' 
                : ''
            }`}
          >
            <div className="p-6">
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  {campaign.title}
                </h3>
                {highlightCampaignId === campaign.id && (
                  <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">
                    New
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                {campaign.description}
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center text-sm text-gray-500">
                  <DollarSign className="mr-1.5 h-4 w-4 text-gray-400" />
                  Budget: ${campaign.budget}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="mr-1.5 h-4 w-4 text-gray-400" />
                  {new Date(campaign.start_date).toLocaleDateString()} -{' '}
                  {new Date(campaign.end_date).toLocaleDateString()}
                </div>
                {campaign.target_location && (
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPin className="mr-1.5 h-4 w-4 text-gray-400" />
                    {campaign.target_location}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {campaign.target_niche.map((niche) => (
                    <span
                      key={niche}
                      className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800"
                    >
                      <Tag className="mr-1 h-3 w-3" />
                      {niche}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <button
                  onClick={() => router.push(`/dashboard/campaigns/${campaign.id}`)}
                  className="w-full rounded-md bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
                >
                  View Details
                </button>
                {appliedCampaigns.includes(campaign.id) ? (
                  <button
                    disabled
                    className="w-full rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm cursor-default"
                  >
                    Applied
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedCampaign(campaign)
                      setShowApplyModal(true)
                    }}
                    className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    Apply Now
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {campaigns.length === 0 && (
          <div className="col-span-3 text-center py-12">
            <p className="text-gray-500">No active campaigns available at the moment.</p>
          </div>
        )}
      </div>

      {/* Apply Modal */}
      {showApplyModal && selectedCampaign && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75"
              onClick={() => setShowApplyModal(false)}
            />
            <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Apply to Campaign: {selectedCampaign.title}
              </h3>
              <form onSubmit={handleApply} className="space-y-4">
                <div>
                  <label
                    htmlFor="proposed_rate"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Proposed Rate ($)
                  </label>
                  <input
                    type="number"
                    name="proposed_rate"
                    id="proposed_rate"
                    required
                    min="0"
                    step="0.01"
                    value={applicationData.proposed_rate}
                    onChange={(e) =>
                      setApplicationData({
                        ...applicationData,
                        proposed_rate: parseFloat(e.target.value)
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="pitch"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Your Pitch
                  </label>
                  <textarea
                    name="pitch"
                    id="pitch"
                    required
                    rows={4}
                    value={applicationData.pitch}
                    onChange={(e) =>
                      setApplicationData({
                        ...applicationData,
                        pitch: e.target.value
                      })
                    }
                    placeholder="Explain why you're a good fit for this campaign..."
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowApplyModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm cursor-pointer font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700p "
                  >
                    Submit Application
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}